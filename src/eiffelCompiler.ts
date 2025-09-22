import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { quote } from 'shell-quote';
import { getOrInstallOrUpdateGoboEiffel } from './eiffelInstaller';

const outputChannel = vscode.window.createOutputChannel("Gobo Eiffel compilation");
const goboEiffelDiagnostics = vscode.languages.createDiagnosticCollection('gobo-eiffel');

export function activateEiffelCompiler(context: vscode.ExtensionContext) {
	context.subscriptions.push(outputChannel);
	context.subscriptions.push(goboEiffelDiagnostics);

	const compileAndRunEiffelFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileAndRunEiffelFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const doc = editor.document;
		const filePath = doc.fileName;
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let compilationOptions = [];
		let buildDir = defaultCwd;
		let args = [];
		let workingDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Compile & Run Current Eiffel File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			compilationOptions = config.compilationOptions ?? [];
			const configBuildDir = config.buildDir;
			buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			args = config.args ?? [];
			const configWorkingDir = config.workingDir;
			workingDir = ((configWorkingDir) ? configWorkingDir : defaultCwd);
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await compileAndRunEiffelSystem(filePath, undefined, compilationOptions, buildDir, args, workingDir, environmentVariables, context);
	});
	context.subscriptions.push(compileAndRunEiffelFileCmd);

	const compileEiffelFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileEiffelFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const doc = editor.document;
		const filePath = doc.fileName;
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let compilationOptions = [];
		let buildDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Compile Current Eiffel File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			compilationOptions = config.compilationOptions ?? [];
			const configBuildDir = config.buildDir;
			buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await compileEiffelSystem(filePath, undefined, compilationOptions, buildDir, environmentVariables, context);
	});
	context.subscriptions.push(compileEiffelFileCmd);

	const runEiffelFileCmd = vscode.commands.registerCommand('gobo-eiffel.runEiffelFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const doc = editor.document;
		const filePath = doc.fileName;
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let buildDir = defaultCwd;
		let args = [];
		let workingDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Run Current Eiffel File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			const configBuildDir = config.buildDir;
			buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			args = config.args ?? [];
			const configWorkingDir = config.workingDir;
			workingDir = ((configWorkingDir) ? configWorkingDir : defaultCwd);
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await runEiffelSystemInTerminal(filePath, undefined, buildDir, args, workingDir, environmentVariables, context);
	});
	context.subscriptions.push(runEiffelFileCmd);

	const compileAndRunWithEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileAndRunWithEcfFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const doc = editor.document;
		const filePath = doc.fileName;
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let compilationOptions = [];
		let buildDir = defaultCwd;
		let args = [];
		let workingDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Compile & Run With Current ECF File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			compilationOptions = config.compilationOptions ?? [];
			const configBuildDir = config.buildDir;
			buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			args = config.args ?? [];
			const configWorkingDir = config.workingDir;
			workingDir = ((configWorkingDir) ? configWorkingDir : defaultCwd);
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await compileAndRunEiffelSystem(filePath, undefined, compilationOptions, buildDir, args, workingDir, environmentVariables, context);
	});
	context.subscriptions.push(compileAndRunWithEcfFileCmd);

	const compileWithEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileWithEcfFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const doc = editor.document;
		const filePath = doc.fileName;
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let compilationOptions = [];
		let buildDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Compile With Current ECF File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			compilationOptions = config.compilationOptions ?? [];
			const configBuildDir = config.buildDir;
			buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await compileEiffelSystem(filePath, undefined, compilationOptions, buildDir, environmentVariables, context);
	});
	context.subscriptions.push(compileWithEcfFileCmd);

	const runWithEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.runWithEcfFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const doc = editor.document;
		const filePath = doc.fileName;
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let buildDir = defaultCwd;
		let args = [];
		let workingDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Run With Current ECF File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			const configBuildDir = config.buildDir;
			buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			args = config.args ?? [];
			const configWorkingDir = config.workingDir;
			workingDir = ((configWorkingDir) ? configWorkingDir : defaultCwd);
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await runEiffelSystemInTerminal(filePath, undefined, buildDir, args, workingDir, environmentVariables, context);
	});
	context.subscriptions.push(runWithEcfFileCmd);
}

/**
 * Compile an Eiffel system or an Eiffel file.
 * @param filePath ECF file used for the compilation, or Eiffel file to compile
 * @param ecfTarget Target in ECF file (default: last target in ECF file)
 * @param compilationOptions Command-line options to be passed to the Eiffel compiler
 * @param buildDir Where to compile the executable
 * @param env Environment variables for the compilation 
 * @param context VSCode extension context
 * @returns the exit code
 */
export async function compileEiffelSystem(
	filePath: string,
	ecfTarget: string | undefined,
	compilationOptions: string[],
	buildDir: string,
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext
): Promise<number> {

	const goboEiffelPath = await getOrInstallOrUpdateGoboEiffel(context);
	if (!goboEiffelPath) {
		return -1;
	}

	const compiler = path.join(goboEiffelPath, 'bin', 'gec' + (os.platform() === 'win32' ? '.exe' : ''));
	try {
		if (!fs.existsSync(compiler)) {
			throw new Error(`file not found: ${compiler}`);
		}
		try {
			fs.accessSync(compiler, fs.constants.X_OK);
		} catch {
			throw new Error(`file is not executable: ${compiler}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Failed to launch Gobo Eiffel compiler: ${err.message}`);
		return -1;
	}

	goboEiffelDiagnostics.clear();
	outputChannel.clear();
	outputChannel.show(true);
	outputChannel.appendLine(`Compiling ${filePath}...`);

	let error_code: number = 0;
	try {
		error_code = await spawnInOutputChannel(
			compiler,
			((ecfTarget) ? [`--target=${ecfTarget}`] : []).concat([...compilationOptions, filePath]),
			buildDir,
			env
		);
	} catch (err: any) {
		if (error_code === 0) {
			error_code = -1;
		}
		vscode.window.showErrorMessage(err.message);
	}
	return error_code;
}

/**
 * Run an already-compiled Eiffel system in the Terminal.
 * @param filePath ECF file used for the compilation, or Eiffel file compiled
 * @param ecfTarget Target in ECF file (default: last target in ECF file)
 * @param buildDir Where to compile the executable
 * @param args Arguments to be passed to the executable
 * @param workingdDir Where to run the executable
 * @param env Environment variables for the execution
 * @param context VSCode extension context
 * @returns a Promise that resolves when the process exits.
 */
export async function runEiffelSystemInTerminal(
	filePath: string,
	ecfTarget: string | undefined,
	buildDir: string,
	args: string[],
	workingDir: string,
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext
): Promise<void> {

	let exeFile = await getExecutableName(filePath, ecfTarget, context);
	if (!exeFile) {
		vscode.window.showErrorMessage(`Cannot run executable: no executable name found for ${filePath}`);
		return;
	}
	exeFile += (os.platform() === 'win32' ? '.exe': '');
	let exefullPath: string;
	exefullPath = path.join(buildDir, exeFile);
	if (buildDir === workingDir) {
		exeFile = (os.platform() === 'win32' ? `.\\"${exeFile}"` : `./"${exeFile}"`);
	} else {
		exeFile = `"${exefullPath}"`;
	}

	try {
		if (!fs.existsSync(exefullPath)) {
			throw new Error(`file not found: ${exefullPath}`);
		}
		try {
			fs.accessSync(exefullPath, fs.constants.X_OK);
		} catch {
			throw new Error(`file is not executable: ${exefullPath}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Cannot run executable: ${err.message}`);
		return;
	}
	const exeCommand = `${exeFile} ${quote(args)}`;

	// Run executable in terminal
	const terminal = vscode.window.createTerminal({
		name: 'Gobo Eiffel Run',
		cwd: workingDir,
		env: env
	});
	terminal.show();
	terminal.sendText(exeCommand);

	return;
}

/**
 * Compile and run (in the Terminal) an Eiffel system or an Eiffel file.
 * @param filePath ECF file used for the compilation, or Eiffel file to compile
 * @param ecfTarget Target in ECF file (default: last target in ECF file)
 * @param compilationOptions Command-line options to be passed to the Eiffel compiler
 * @param buildDir Where to compile the executable
 * @param args Arguments to be passed to the executable
 * @param workingdDir Where to run the executable
 * @param env Environment variables for the compilation and execution
 * @param context VSCode extension context
 * @returns a Promise that resolves when the process exits.
 */
export async function compileAndRunEiffelSystem(
	filePath: string,
	ecfTarget: string | undefined,
	compilationOptions: string[],
	buildDir: string,
	args: string[],
	workingDir: string,
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext
): Promise<void> {
	compileEiffelSystem(filePath, ecfTarget, compilationOptions, buildDir, env, context).then((code) => {
		if (code === 0) {
			runEiffelSystemInTerminal(filePath, ecfTarget, buildDir, args, workingDir, env, context);
		}
	});
	return;
}

/**
 * Get the executable name of the Eiffel system
 * @param filePath ECF file used for the compilation, or Eiffel file compiled
 * @param ecfTarget Target in ECF file (default: last target in ECF file)
 * @param context VSCode extension context
 * @returns the executable name or undefined on error
 */
export async function getExecutableName(
	filePath: string, 
	ecfTarget: string | undefined,
	context: vscode.ExtensionContext
): Promise<string | undefined> {

	const goboEiffelPath = await getOrInstallOrUpdateGoboEiffel(context);
	if (!goboEiffelPath) {
		return undefined;
	}
	const gedocPath = path.join(goboEiffelPath, 'bin', 'gedoc' + (os.platform() === 'win32' ? '.exe' : ''));
	try {
		if (!fs.existsSync(gedocPath)) {
			throw new Error(`File not found: ${gedocPath}`);
		}
		try {
			fs.accessSync(gedocPath, fs.constants.X_OK);
		} catch {
			throw new Error(`File is not executable: ${gedocPath}`);
		}
	} catch (err: any) {
		return;
	}
	return new Promise((resolve) => {
		const ecfTargetOption = ((ecfTarget) ? ` --target=${ecfTarget}` : '');
		cp.exec(`"${gedocPath}" --format=executable_name${ecfTargetOption} --no-benchmark "${filePath}"`, (err, stdout) => {
			if (err) {
				resolve(undefined);
			} else {
				const match = stdout.match(/^(.*)/);
				if (match) {
					resolve(match[1]);
				} else {
					resolve(undefined);
				}
			}
		});
	});
}

/**
 * Run program in Output channel, with Eiffel compilation errors
 * also reported in the Problems window.
 * Process Zig progress information (sent to stderr)
 * @param program Program to be executed
 * @param args Arguments to be passed to the program
 * @param cwd Where to run the program
 * @param env Environment variables to be passed to the program 
 * @returns the exit code
 */
async function spawnInOutputChannel(
	program: string,
	args: string[],
	cwd: string,
	env: NodeJS.ProcessEnv,
): Promise<number> {
	const childEnv = { ...env, ZIG_PROGRESS: '3', ZIG_VERBOSE_CC: 'true' };

	let error_code: number = 0;
	await new Promise<void>((resolve, reject) => {
		const child = cp.spawn(
			program,
			args,
			{ cwd: cwd, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] }
		);

		const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();
		let lastDiagnosticMessage: string | undefined;
		let lastDiagnosticLine: number = 1;
		let lastDiagnosticColumn: number = 1;
		let lastDiagnosticCode: string | undefined;
		let lastDiagnosticFile: string | undefined;
		let outBuffer = '';
		if (child.stdout) {
			child.stdout.setEncoding('utf8');
			child.stdout.on('data', (d: string) => {
				let needDiagnosticsUpdate: boolean = false;
				outBuffer += d.replace(/\r/g, '');
				let idx: number;
				while ((idx = outBuffer.indexOf('\n')) !== -1) {
					const line = outBuffer.slice(0, idx);
					outBuffer = outBuffer.slice(idx + 1);
					outputChannel.appendLine(line);

					const validityErrorMatch = line.match(/^\[([^\]]+)\] (class [a-zA-Z][a-zA-Z0-9_]*) \((([a-zA-Z][a-zA-Z0-9_]*),)?(\d+),(\d+)\)(: .*)$/);
					const syntaxErrorMatch = line.match(/^(Syntax error:)$/);
					if (validityErrorMatch) {
						lastDiagnosticLine = Number(validityErrorMatch[5]);
						lastDiagnosticColumn = Number(validityErrorMatch[6]);
						lastDiagnosticMessage = validityErrorMatch[2];
						if (validityErrorMatch[4]) {
							lastDiagnosticMessage += ` (${validityErrorMatch[4]})`;
						}
						lastDiagnosticMessage += validityErrorMatch[7];
						lastDiagnosticCode = validityErrorMatch[1];
					} else if (syntaxErrorMatch) {
						lastDiagnosticMessage = syntaxErrorMatch[1];
					} else if (lastDiagnosticMessage) {
						if (line === '----') {
							if (lastDiagnosticFile) {
								let endColumn: number = lastDiagnosticColumn + 1;
								let errorLine = getNthLineSync(lastDiagnosticFile, lastDiagnosticLine);
								if (errorLine) {
									errorLine = errorLine.slice(lastDiagnosticColumn - 1);
									const identifierOrIntegerMatch = errorLine.match(/^([a-zA-Z0-9_]+)/); // Possibly with lexical error.
									if (identifierOrIntegerMatch) {
										endColumn = lastDiagnosticColumn + identifierOrIntegerMatch[1].length;
									}
								}
								const lastDiagnostic = new vscode.Diagnostic(
									new vscode.Range(lastDiagnosticLine - 1, lastDiagnosticColumn - 1, lastDiagnosticLine - 1, endColumn - 1),
									lastDiagnosticMessage,
									vscode.DiagnosticSeverity.Error
								);
								lastDiagnostic.source = 'Eiffel';
								if (lastDiagnosticCode) {
									lastDiagnostic.code = lastDiagnosticCode;
								}
								if (!diagnosticsByFile.has(lastDiagnosticFile)) {
									diagnosticsByFile.set(lastDiagnosticFile, []);
								}
								diagnosticsByFile.get(lastDiagnosticFile)!.push(lastDiagnostic);
								needDiagnosticsUpdate = true;
							}
							lastDiagnosticFile = undefined;
							lastDiagnosticMessage = undefined;
							lastDiagnosticLine = 1;
							lastDiagnosticColumn = 1;
							lastDiagnosticCode = undefined;
						} else {
							const validityErrorFileMatch = line.match(/^\tclass [a-zA-Z0-9_]+: (.*)$/);
							const SyntaxErrorFileMatch = line.match(/^line (\d+) column (\d+) in (.*)$/);
							if (validityErrorFileMatch) {
								lastDiagnosticFile = validityErrorFileMatch[1];
							} else if (SyntaxErrorFileMatch) {
								lastDiagnosticLine = Number(SyntaxErrorFileMatch[1]);
								lastDiagnosticColumn = Number(SyntaxErrorFileMatch[2]);
								lastDiagnosticFile = SyntaxErrorFileMatch[3];
							} else {
								lastDiagnosticMessage += '\n' + line;
							}
						}
					}
				}

				// If buffer grows very large without newline, try to handle as a single message (fallback)
				const MAX_BUF = 1024 * 64; // 64KB
				if (outBuffer.length > MAX_BUF) {
					outBuffer = '';
				}

				// Real-time update
				if (needDiagnosticsUpdate) {
					goboEiffelDiagnostics.clear();
					for (const [file, diags] of diagnosticsByFile) {
						const uri = vscode.Uri.file(file);
						goboEiffelDiagnostics.set(uri, diags);
					}
				}
			});
		}

		let errBuffer = '';
		if (child.stderr) {
			child.stderr.setEncoding('utf8');
			child.stderr.on('data', (d: string) => {
				// Try to split by newline; if no newline, accumulate in buffer
				errBuffer += d;
				// If we have newline(s), process each line
				let idx: number;
				while ((idx = errBuffer.indexOf('\n')) !== -1) {
					const line = errBuffer.slice(0, idx);
					errBuffer = errBuffer.slice(idx + 1);
					const matchCFile = line.match(/^(.*[\/\\]zig[\/\\])?zig(\.exe)? clang (.*[\/\\])?([^\/\\]+\.[cS]) /);
					const matchIgnore = line.match(/^(output path: )|(include dir: )|(def file: )/);
					if (matchCFile) {
						const cFile = matchCFile[4];
						outputChannel.appendLine(cFile);
					} else if (!matchIgnore) {
						outputChannel.appendLine(line);
					}
				}

				// If buffer grows very large without newline, try to handle as a single message (fallback)
				const MAX_BUF = 1024 * 64; // 64KB
				if (errBuffer.length > MAX_BUF) {
					outputChannel.append(errBuffer);
					errBuffer = '';
				}
			});
		}

		child.on('error', (err) => {
			error_code = -1;
			reject(err);
		});
		child.on('close', (code) => {
			if (code !== null) {
				error_code = code;
			}
			if (code === 0){
				resolve();
			} else {
				reject(new Error(`Compilation failed with code ${code}`));
			}
		});
	});
	return error_code;
}

/**
 * Get the N-th line in a file
 * @param filePath Name of the file
 * @param n Line number
 * @param context VSCode extension context
 * @returns the n-th line, or undefined on error
 */
function getNthLineSync(filePath: string, n: number): string | undefined {
	if (n <= 0) {
		return undefined;
	}

	const fd = fs.openSync(filePath, 'r'); // open file descriptor
	const buffer = Buffer.alloc(1024);     // read in chunks
	let line = '';
	let lineCount = 0;
	let bytesRead: number;

	try {
		do {
			bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
			if (bytesRead > 0) {
				let chunk = buffer.toString('utf8', 0, bytesRead);
				for (let i = 0; i < chunk.length; i++) {
					const char = chunk[i];
					if (char === '\n') {
						lineCount++;
						if (lineCount === n) {
							// strip trailing \r if Windows line endings
							return line.replace(/\r$/, '');
						}
						line = '';
					} else {
						line += char;
					}
				}
			}
		} while (bytesRead > 0);

		// if file ended but maybe last line without newline
		if (line && lineCount + 1 === n) {
			return line.replace(/\r$/, '');
		}
	} catch (err) {
		return undefined;
	} finally {
		fs.closeSync(fd);
	}
	return undefined;
}
