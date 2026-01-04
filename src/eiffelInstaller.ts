import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as https from 'https';
import { path7za } from '7zip-bin';
import { restartLanguageServer } from './eiffelLanguageServer';
import { ensureEmptyDir } from './eiffelUtilities';

export function activateEiffelInstaller(context: vscode.ExtensionContext) {
	const selectGoboEiffelInstallationCmd = vscode.commands.registerCommand('gobo-eiffel.selectGoboEiffelInstallation', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		await selectOrDownloadAndInstall(context);
	});
	context.subscriptions.push(selectGoboEiffelInstallationCmd);
}

/**
 * Get the path to Gobo Eiffel installation.
 * Download and install it if needed.
 * @param context VSCode extension context
 * @returns path to Gobo Eiffel installation or undefined on error
 */
export async function getOrInstallOrUpdateGoboEiffel(context: vscode.ExtensionContext): Promise<string | undefined> {

	const goboPath = getCurrentlySelectedGoboEiffel(context);

	if (goboPath && fs.existsSync(path.join(goboPath, 'bin', 'gec' + (os.platform() === 'win32' ? '.exe' : '')))) {
		// If we have a stored version, check update
		return await checkForUpdates(goboPath, context);
	}

	let message: string;
	if (goboPath) {
		message = `Gobo Eiffel installation not found in ${goboPath}.`;
	} else {
		message = 'Gobo Eiffel installation not found.';
	}
	return await selectOrDownloadAndInstall(context, message);
}

/**
 * Select Gobo Eiffel installation, or Download and install latest version of Gobo Eiffel.
 * @param context VSCode extension context
 * @returns path to the selected installation of Gobo Eiffel, or undefined on error
 */
export async function selectOrDownloadAndInstall(context: vscode.ExtensionContext, message?: string): Promise<string | undefined> {
	const goboPath = getCurrentlySelectedGoboEiffel(context);
	if (!message) {
		if (goboPath) {
			let goboFullVersion = '';
			const goboVersion = await getLocalGoboVersion(goboPath);
			if (goboVersion) {
				goboFullVersion = ` (version ${goboVersion.longVersion})`;
			}
			message = `Currently selected Gobo Eiffel installation${goboFullVersion}:\n\n${goboPath}\n\nSwitch to another Gobo Eiffel installation.`;
		} else {
			message = `No Gobo Eiffel installation currently selected.\nSelect Gobo Eiffel installation.`;
		}
	}
	const choice = await vscode.window.showInformationMessage(
		message,
		{ modal: true },
		'Download Latest & Install',
		'Select Existing Installation'
	);

	if (choice === 'Select Existing Installation') {
		let dialogOptions: vscode.OpenDialogOptions = {
			canSelectFiles: false,
			canSelectFolders: true,
			openLabel: 'Select Gobo Eiffel Folder'
		};
		if (goboPath  && fs.existsSync(goboPath)) {
			dialogOptions = { ...dialogOptions, defaultUri: vscode.Uri.file(path.dirname(goboPath)) };
		}
		const uris = await vscode.window.showOpenDialog(dialogOptions);
		if (uris && uris.length > 0) {
			const chosen = uris[0].fsPath;
			context.globalState.update(getGoboEiffelPathKey(), chosen);
			restartLanguageServer(context);
			return chosen;
		}
		return;
	}

	if (choice === 'Download Latest & Install') {
		const latestRelease = await fetchLatestRelease();
		if (!latestRelease) {
			vscode.window.showErrorMessage('Could not fetch latest Gobo Eiffel release');
			return;
		}
		return await downloadAndInstall(latestRelease.fileUrl, latestRelease.fileName, latestRelease.version, context);
	}

	return; // Cancel
}

/**
 * Get the path to currently selected Gobo Eiffel installation.
 * @param context VSCode extension context
 * @returns path to currently selected Gobo Eiffel installation or undefined on error
 */
function getCurrentlySelectedGoboEiffel(context: vscode.ExtensionContext): string | undefined {
	let goboPath: string | undefined;
	// 1. Check previously stored path
	goboPath = context.globalState.get<string>(getGoboEiffelPathKey());
	if (!goboPath) {
		goboPath = context.globalState.get<string>('goboEiffelPath');
		if (goboPath) {
			context.globalState.update(getGoboEiffelPathKey(), goboPath);
		}
	}
	if (!goboPath) {
		// 2. Check $GOBO
		goboPath = process.env.GOBO;
		if (goboPath) {
			context.globalState.update(getGoboEiffelPathKey(), goboPath);
		}
	}
	return goboPath;
}

/**
 * Get the key to get goboEiffelPath in globalState.
 * @returns key to get goboEiffelPath in globalState.
 */
function getGoboEiffelPathKey(): string {
	const nodePlatform = os.platform();
	let platformForPackage: string;
	if (nodePlatform === 'win32') {
		platformForPackage = 'windows';
	} else if (nodePlatform === 'darwin') {
		platformForPackage = 'macos';
	} else if (nodePlatform === 'linux') {
		platformForPackage = 'linux';
	} else {
		platformForPackage = nodePlatform; // fallback
	}
	const nodeArch = os.arch();
	let archForPackage: string;
	if (nodeArch === 'x64') {
		archForPackage = 'x86_64';
	} else if (nodeArch === 'arm64') {
		archForPackage = 'arm64';
	} else {
		archForPackage = nodeArch;
	}
	return `goboEiffelPath-${platformForPackage}-${archForPackage}`;
}

// How long to wait between checks (ms)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Check whether the Gobo Eiffel installation is uptodate.
 * Download and install new version if needed.
 * @param goboPath Existing Gobo Eiffel installation
 * @param context VSCode extension context
 * @returns path to existing or newer installation of Gobo Eiffel, or undefined on error
 */
async function checkForUpdates(goboPath: string, context: vscode.ExtensionContext): Promise<string | undefined> {
	// Read configuration
	const automaticUpdateCheck = vscode.workspace.getConfiguration('gobo-eiffel').get<boolean>('automaticUpdateCheck');
	if (!automaticUpdateCheck) {
		return goboPath; // No auto check
	}

	// Read last check timestamp from global state
	const lastCheck = context.globalState.get<number>('lastGoboEiffelUpdateCheck', 0);
	const now = Date.now();

	if (now - lastCheck < ONE_DAY_MS) {
		// Last check was within the last day — skip
		return goboPath;
	}

	// Update stored timestamp before doing network call
	await context.globalState.update('lastGoboEiffelUpdateCheck', now);

	// Fetch release
	const latestRelease = await fetchLatestRelease();
	if (!latestRelease) {
		vscode.window.showErrorMessage('Could not fetch latest Gobo Eiffel release');
		return goboPath;
	}

	const goboVersion = await getLocalGoboVersion(goboPath);
	const goboFullVersion = ((goboVersion) ? `${goboVersion.longVersion}` : '');
	const latestReleaseVersion = latestRelease.version;
	const latestReleaseFullVersion = `${latestReleaseVersion.longVersion}`;

	if (goboVersion && latestReleaseFullVersion !== goboFullVersion) {
		const choice = await vscode.window.showInformationMessage(
			`A newer release of Gobo Eiffel (${latestReleaseFullVersion}) is available.`,
			{ modal: true },
			'Update',
			'Skip'
		);
		if (choice === 'Update') {
			return await downloadAndInstall(latestRelease.fileUrl, latestRelease.fileName, latestRelease.version, context);
		}
		if (choice === 'Skip') {
			return goboPath;
		}
		return; // Cancel
	}

	return goboPath;
}

/**
 * Download and install latest version of Gobo Eiffel.
 * @param fileUrl URL of the file to be downloaded
 * @param fileName Name  of the file to be downloaded
 * @param context VSCode extension context
 * @returns path to the new installation of Gobo Eiffel, or undefined on error
 */
async function downloadAndInstall(fileUrl: string, fileName: string, version: GoboVersion, context: vscode.ExtensionContext): Promise<string | undefined> {
	const goboPath = getCurrentlySelectedGoboEiffel(context);
	let dialogOptions: vscode.OpenDialogOptions = {
		canSelectFiles: false,
		canSelectFolders: true,
		openLabel: 'Select Install Folder'
	};
	if (goboPath  && fs.existsSync(goboPath)) {
		dialogOptions = { ...dialogOptions, defaultUri: vscode.Uri.file(path.dirname(goboPath)) };
	}
	const installUris = await vscode.window.showOpenDialog(dialogOptions);
	if (!installUris || installUris.length === 0) {
		return;
	}
	const installDir = path.join(installUris[0].fsPath, `gobo-${version.year}.${version.month}.${version.day}+${version.commit}`);
	try {
		ensureEmptyDir(installDir); // throws if not empty
	} catch (err: any) {
		vscode.window.showErrorMessage(`Installation cannot continue: ${err.message}`);
		return;
	}

	const destFile = path.join(installDir, fileName);

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `Downloading ${fileName}`,
			cancellable: false
		},
		async (progress) => {
			let lastFloor = 0;
			await downloadFile(fileUrl, destFile, (percent) => {
				const floor = Math.floor(percent);
				const delta = floor - lastFloor;
				if (delta > 0) {
					progress.report({ increment: delta, message: `${floor}%` });
					lastFloor = floor;
				}
			});
			// final report to reach 100%
			progress.report({ increment: 100 - lastFloor, message: '100%' });
		}
	);

	try {
		if (!fs.existsSync(destFile)) {
			throw new Error(`file not found: ${destFile}`);
		}
		const stats = fs.statSync(destFile);
		if (stats.size === 0) {
			throw new Error(`file is empty: ${destFile}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Download failed: ${err.message}`);
		return;
	}

	// Detect extension and extract accordingly
	if (fileName.endsWith('.tar.xz')) {
		try {
			await extractTarXzWithProgress(destFile, installDir);
		} catch (err) {
			vscode.window.showErrorMessage('Extraction failed: ' + String(err));
			return;
		}
	} else if (fileName.endsWith('.7z')) {
		try {
			await extract7zWithProgress(destFile, installDir);
		} catch (err) {
			vscode.window.showErrorMessage('Extraction failed: ' + String(err));
			return;
		}
	} else {
		vscode.window.showErrorMessage('Unknown archive format: ' + fileName);
		return;
	}

	// Move content up if it’s in a "gobo" folder
	const goboFolder = path.join(installDir, 'gobo');
	if (fs.existsSync(goboFolder) && fs.lstatSync(goboFolder).isDirectory()) {
		const files = fs.readdirSync(goboFolder);
		for (const file of files) {
			const src = path.join(goboFolder, file);
			const dest = path.join(installDir, file);
			fs.renameSync(src, dest);
		}
		// Remove inner gobo folder
		fs.rmSync(goboFolder, { recursive: true, force: true });
	}
	// Cleanup archive
	fs.rmSync(destFile, { force: true });

	const gecPath = path.join(installDir, 'bin', 'gec' + (os.platform() === 'win32' ? '.exe' : ''));
	try {
		if (!fs.existsSync(gecPath)) {
			throw new Error(`file not found: ${gecPath}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Failed to install Gobo Eiffel: ${err.message}`);
		return;
	}

	context.globalState.update(getGoboEiffelPathKey(), installDir);
	vscode.window.showInformationMessage(`Gobo Eiffel installed in ${installDir}`);
	restartLanguageServer(context);
	return installDir;
}

export interface GoboVersion {
	year: string;
	month: string;
	day: string;
	commit: string;
	shortVersion: string;
	longVersion: string
}

/**
 * Get the Gobo Eiffel version for a given installation folder.
 * @param goboPath folder containing Gobo Eiffel installation
 * @returns version object or undefined on error
 */
export async function getLocalGoboVersion(goboPath: string): Promise<GoboVersion | undefined> {
	const gecPath = path.join(goboPath, 'bin', 'gec' + (os.platform() === 'win32' ? '.exe' : ''));
	try {
		if (!fs.existsSync(gecPath)) {
			throw new Error(`file not found: ${gecPath}`);
		}
		try {
			fs.accessSync(gecPath, fs.constants.X_OK);
		} catch {
			throw new Error(`File is not executable: ${gecPath}`);
		}
	} catch (err: any) {
		return;
	}
	return new Promise((resolve) => {
		cp.exec(`"${gecPath}" --version`, (err, stdout) => {
			if (err) {
				resolve(undefined);
			} else {
				// stdout might be like: "gec version 25.09.02+27e7bdab2"
				const match = stdout.match(/gec version (\d+)\.(\d+)\.(\d+)\+([0-9a-fA-F]+)/);
				if (match) {
					resolve({
						year: match[1],
						month: match[2], 
						day: match[3],
						commit: match[4],
						shortVersion: `${match[1]}.${match[2]}`,
						longVersion: `${match[1]}.${match[2]}.${match[3]}+${match[4]}`
					});
				} else {
					resolve(undefined);
				}
			}
		});
	});
}

/**
 * Get information about the latest release of Gobo Eiffel.
 * @returns information about the latest release of Gobo Eiffel, or undefined on error
 */
async function fetchLatestRelease(): Promise<{ fileUrl: string; fileName: string; version: GoboVersion } | undefined> {
	const nightlyBuild = vscode.workspace.getConfiguration('gobo-eiffel').get<boolean>('useNightlyBuild');
	const apiUrlLatest = 'https://api.github.com/repos/gobo-eiffel/gobo/releases/latest';
	const apiUrlReleases = 'https://api.github.com/repos/gobo-eiffel/gobo/releases';
	const apiUrl = ((nightlyBuild) ? apiUrlReleases : apiUrlLatest);
	return new Promise((resolve) => {
		https
			.get(apiUrl, { headers: { 'User-Agent': 'VSCode-GoboEiffel' } }, (res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					try {
						let release;
						if (nightlyBuild) {
							const releases = JSON.parse(data);
							release = releases.find((a: any) => a.tag_name === 'nightly');
						} else {
							release = JSON.parse(data);
						}
						if (!release) {
							return;
						}
						const nodePlatform = os.platform();
						let platformForPackage: string;
						if (nodePlatform === 'win32') {
							platformForPackage = 'windows';
						} else if (nodePlatform === 'darwin') {
							platformForPackage = 'macos';
						} else if (nodePlatform === 'linux') {
							platformForPackage = 'linux';
						} else {
							platformForPackage = nodePlatform; // fallback
						}
						const nodeArch = os.arch();
						let archForPackage: string;
						if (nodeArch === 'x64') {
							archForPackage = 'x86_64';
						} else if (nodeArch === 'arm64') {
							archForPackage = 'arm64';
						} else {
							archForPackage = nodeArch;
						}
						const namePrefix = `gobo-${platformForPackage}-${archForPackage}-`;

						const asset = release.assets.find((a: any) =>
							a.name.includes(namePrefix)
						);
						if (asset) {
							const match = asset.name.match(/\-(\d+)\.(\d+)\.(\d+)\+([0-9a-fA-F]+)\./);
							if (match) {
								resolve({
									fileUrl: asset.browser_download_url,
									fileName: asset.name,
									version: {
										year: match[1],
										month: match[2], 
										day: match[3],
										commit: match[4],
										shortVersion: `${match[1]}.${match[2]}`,
										longVersion: `${match[1]}.${match[2]}.${match[3]}+${match[4]}`
									}
								});
							} else {
								resolve(undefined);
							}
						} else {
							resolve(undefined);
						}
					} catch {
						resolve(undefined);
					}
				});
			})
			.on('error', () => resolve(undefined));
	});
}

/**
 * Download a URL to dest. Follows redirects and reports absolute percent (0..100).
 * @param url remote URL
 * @param dest local destination file path
 * @param onProgress optional callback(percent:number) where percent is 0..100 (absolute)
 * @returns a Promise that resolves when the process exits.
 */
export function downloadFile(
	url: string,
	dest: string,
	onProgress?: (percent: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const maxRedirects = 10;
		let redirects = 0;

		// ensure dest directory exists
		try {
			fs.mkdirSync(path.dirname(dest), { recursive: true });
		} catch (err) {
			// ignore
		}

		function doGet(u: string) {
			const opts = new URL(u);
			const req = https.get(
				{
					hostname: opts.hostname,
					path: opts.pathname + opts.search,
					port: opts.port ? Number(opts.port) : undefined,
					protocol: opts.protocol,
					headers: {
						'User-Agent': 'VSCode-GoboEiffel',
						'Accept': 'application/octet-stream'
					}
				},
				(res) => {
					// follow redirects
					if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode)) {
						const loc = res.headers.location;
						res.resume(); // consume and discard
						if (loc && redirects < maxRedirects) {
							redirects++;
							const next = new URL(loc, u).toString();
							doGet(next);
							return;
						} else {
							reject(new Error('Too many redirects or missing Location header'));
							return;
						}
					}

					if (res.statusCode !== 200) {
						reject(new Error(`Download failed: HTTP ${res.statusCode}`));
						return;
					}

					const total = parseInt((res.headers['content-length'] || '0') as string, 10);
					let downloaded = 0;
					let lastReportedPercent = 0;

					const fileStream = fs.createWriteStream(dest);
					fileStream.on('error', (err) => {
						// cleanup partial file
						try { fs.unlinkSync(dest); } catch (_) {}
						reject(err);
					});

					res.on('data', (chunk: Buffer) => {
						downloaded += chunk.length;
						if (total > 0 && typeof onProgress === 'function') {
							const percent = Math.min(100, (downloaded / total) * 100);
							// only call back if percent went up by at least 1%
							if (Math.floor(percent) !== Math.floor(lastReportedPercent)) {
								lastReportedPercent = percent;
								try { onProgress(percent); } catch (_) {}
							}
						}
					});

					res.pipe(fileStream);

					fileStream.on('finish', () => {
						fileStream.close(() => resolve());
					});

					res.on('error', (err) => {
						try { fileStream.close(); } catch (_) {}
						try { fs.unlinkSync(dest); } catch (_) {}
						reject(err);
					});
				}
			);

			req.on('error', (err) => {
				reject(err);
			});
		}

		doGet(url);
	});
}

/**
 * Extract a .7z archive using the embedded 7za binary from 7zip-bin.
 * Report progress via vscode.withProgress (percentage).
 * @param compressedFile Name of compressed file
 * @param extractedDir Where to copy the extracted files
 * @returns a Promise that resolves when the process exits.
 */
export async function extract7zWithProgress(
	compressedFile: string,
	extractedDir: string
): Promise<void> {
	if (!fs.existsSync(compressedFile)) {
		throw new Error(`Archive not found: ${compressedFile}`);
	}
	if (!path7za || typeof path7za !== 'string') {
		throw new Error('7za binary not available');
	}

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `Installing ${path.basename(compressedFile)}`,
			cancellable: false
		},
		(progress) => {
			return new Promise<void>((resolve, reject) => {
				progress.report({ increment: 0, message: '0%' });
				// First, list the archive contents to count files
				const listProc = cp.spawn(path7za, ['l', '-ba', compressedFile], { stdio: ['ignore', 'pipe', 'pipe'] });
				let listOutput = '';
				listProc.stdout.setEncoding('utf8');
				listProc.stdout.on('data', (buf: Buffer) => { listOutput += buf.toString(); });
				listProc.stderr.setEncoding('utf8');
				listProc.stderr.on('data', (buf: Buffer) => { listOutput += buf.toString(); });
				listProc.on('error', (err) => reject(err));

				listProc.on('close', (code) => {
					if (code !== 0) {
						return reject(new Error(`7z list failed with code ${code}`));
					}

					// Count lines that look like files
					let entries = listOutput.split(/\r?\n/);
					const totalFiles = entries.length || 1;  // avoid div by zero
					entries = [];
					listOutput = '';

					// Extract with output parsing
					const args = ['x', compressedFile, `-o${extractedDir}`, '-y', '-bsp1'];
					const extractProc = cp.spawn(path7za, args, { stdio: ['ignore', 'pipe', 'ignore'] });

					let lastPercent = -1;
					extractProc.stdout.setEncoding('utf8');
					extractProc.stdout.on('data', (buf: Buffer) => {
						const s = buf.toString();
						const lines = s.split(/\r?\n/);
						for (const line of lines) {
							const matchProgress = line.match(/\d+%\s*(\d+)/);
							if (matchProgress) {
								const extractedFiles = matchProgress[1];
								const percent = Math.floor((Number(extractedFiles) / totalFiles) * 100);
								if (percent > lastPercent) {
									progress.report({ increment: percent - lastPercent, message: `${percent}%` });
									lastPercent = percent;
								}
							}
						}
					});

					extractProc.on('close', (code) => {
						if (lastPercent < 100) {
							progress.report({ increment: 100 - lastPercent, message: '100%' });
						}
						if (code === 0) {
							resolve();
						} else {
							reject(new Error(`7z extraction failed with code ${code}`));
						}
					});
					extractProc.on('error', (err) => reject(err));
				});
			});
		}
	);
}

/**
 * Extract a .tar.xz archive.
 * Report progress via vscode.withProgress (percentage).
 * @param compressedFile Name of compressed file
 * @param extractedDir Where to copy the extracted files
 * @returns a Promise that resolves when the process exits.
 */
export async function extractTarXzWithProgress(
	compressedFile: string,
	extractedDir: string
): Promise<void> {
	if (!fs.existsSync(compressedFile)) {
		throw new Error(`Archive file not found: ${compressedFile}`);
	}

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `Installing ${path.basename(compressedFile)}`,
			cancellable: false
		},
		async (progress) => {
			return new Promise<void>((resolve, reject) => {
				progress.report({ increment: 0, message: '0%' });
				// First, list the archive contents to count files
				const listProc = cp.spawn('tar', ['--checkpoint', '-tf', compressedFile], { stdio: ['ignore', 'ignore', 'pipe'] });
				let totalFiles = 1;
				listProc.stderr.setEncoding('utf8');
				listProc.stderr.on('data', (buf: Buffer) => {
					const s = buf.toString();
					const lines = s.split('\n');
					for (const line of lines) {
						const matchProgress = line.match(/Read checkpoint\s+(\d+)/);
						if (matchProgress) {
							totalFiles = Number(matchProgress[1]);
						}
					}
				});
				listProc.on('error', (err) => reject(err));

				listProc.on('close', (code) => {
					if (code !== 0) {
						return reject(new Error(`tar list failed with code ${code}`));
					}
					// Extract with output parsing
					const args = ['--checkpoint', '-xJv', '-f', compressedFile, '-C', extractedDir];
					const extractProc = cp.spawn('tar', args, { stdio: ['ignore', 'ignore', 'pipe'] });

					let lastPercent = -1;
					let extractedFiles = 0;
					extractProc.stderr.setEncoding('utf8');
					extractProc.stderr.on('data', (buf: Buffer) => {
						const s = buf.toString();
						const lines = s.split('\n');
						for (const line of lines) {
							const matchProgress = line.match(/Read checkpoint\s+(\d+)/);
							if (matchProgress) {
								extractedFiles = Number(matchProgress[1]);
								const percent = Math.floor((extractedFiles / totalFiles) * 100);
								if (percent > lastPercent) {
									progress.report({ increment: percent - lastPercent, message: `${percent}%` });
									lastPercent = percent;
								}
							}
						}
					});

					extractProc.on('close', (code) => {
						if (lastPercent < 100) {
							progress.report({ increment: 100 - lastPercent, message: '100%' });
						}
						if (code === 0) {
							resolve();
						} else {
							reject(new Error(`tar extraction failed with code ${code}`));
						}
					});
					extractProc.on('error', (err) => reject(err));
				});
			});
		}
	);
}
