import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getOrInstallOrUpdateGoboEiffel } from './eiffelInstaller';

/**
 * Replace environment variables with their values in a string.
 * Get the value of $GOBO if not in the environment variables yet.
 * @param str String to be processed
 * @param env Environment variables
 * @param context VSCode extension context
 * @param uri File where the variables will be used (needed in case of multi-root workspaces)
 * @returns the new string
 */
export async function expandEnvVars(
	str: string,
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext,
	uri?: vscode.Uri
): Promise<string> {
	const envIndex = buildEnvIndex(env);

	let match = str.match(/\$\{GOBO\}|\$GOBO/);
	if (match && envIndex.get('GOBO') === undefined) {
		const goboPath = await getOrInstallOrUpdateGoboEiffel(context);
		if (goboPath) {
			envIndex.set('GOBO', goboPath);
		}
	}

	// ${workspaceFolder}
	let workspaceFolderKey = "workspaceFolder";
	if (process.platform === "win32") {
		workspaceFolderKey = workspaceFolderKey.toUpperCase();
	}
	if (envIndex.get(workspaceFolderKey) === undefined) {
		const folder = uri
			? vscode.workspace.getWorkspaceFolder(uri)
			: vscode.workspace.workspaceFolders?.[0];
		envIndex.set(workspaceFolderKey, folder?.uri.fsPath ?? "");
	}

	return str.replace(/\$\{([^}]+)\}|\$([A-Za-z0-9_]+)/g, (_, var1, var2) => {
		let name = var1 || var2;
		if (process.platform === "win32") {
			name = name.toUpperCase();
		}
		return envIndex.get(name) ?? ''; // empty string if undefined
	});
}

/**
 * Resolve environment variables in `env` with values set
 * in `processEnv` or in `env` itself.
 * @param env Variables to be resolved
 * @param processEnv Variables already defined
 * @param context VSCode extension context
 * @param uri File where the variables will be used (needed in case of multi-root workspaces)
 * @returns Resolved variables
 */
export async function resolveEnvironmentVariables(
	env: Record<string, string>,
	processEnv: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext,
	uri?: vscode.Uri
): Promise<NodeJS.ProcessEnv> {

	const resolved: Record<string, string> = {};
	const resolving = new Set<string>();
	const envIndex = buildEnvIndex(env);
	const processEnvIndex = buildEnvIndex(processEnv);

	if (processEnvIndex.get('GOBO') === undefined && envIndex.get('GOBO') === undefined) {
		const goboPath = await getOrInstallOrUpdateGoboEiffel(context);
		if (goboPath) {
			processEnvIndex.set('GOBO', goboPath);
		}
	}

	// ${workspaceFolder}
	let workspaceFolderKey = "workspaceFolder";
	if (process.platform === "win32") {
		workspaceFolderKey = workspaceFolderKey.toUpperCase();
	}
	if (processEnvIndex.get(workspaceFolderKey) === undefined && envIndex.get(workspaceFolderKey) === undefined) {
		const folder = uri
			? vscode.workspace.getWorkspaceFolder(uri)
			: vscode.workspace.workspaceFolders?.[0];
		processEnvIndex.set(workspaceFolderKey, folder?.uri.fsPath ?? "");
	}

	function resolveVar(name: string): string {

		if (process.platform === "win32") {
			name = name.toUpperCase();
		}

		// already resolved
		if (resolved[name] !== undefined) {
			return resolved[name];
		}

		// cycle detection
		if (resolving.has(name)) {
			// Circular environment variable reference.
			return "";
		}

		resolving.add(name);

		let value = envIndex.get(name) ?? "";

		value = value.replace(/\$\{([^}]+)\}|\$([A-Za-z0-9_]+)/g, (_, var1, var2) => {
			let expr = var1 || var2;
			if (process.platform === "win32") {
				expr = expr.toUpperCase();
			}

			// reference to another env variable
			if (envIndex.get(expr) !== undefined) {
				return resolveVar(expr);
			}

			return processEnvIndex.get(expr) ?? "";
		});

		resolving.delete(name);
		resolved[name] = value;

		return value;
	}

	for (const name of Object.keys(env)) {
		resolveVar(name);
	}

	return resolved;
}


function buildEnvIndex(env: NodeJS.ProcessEnv): Map<string, string> {
	const map = new Map<string, string>();

	if (process.platform === "win32") {
		for (const [key, value] of Object.entries(env)) {
			if (value !== undefined) {
				map.set(key.toUpperCase(), value);
			}
		}
	} else {
		for (const [key, value] of Object.entries(env)) {
			if (value !== undefined) {
				map.set(key, value);
			}
		}
	}

	return map;
}

/**
 * Get the N-th line in a file.
 * @param filePath Name of the file
 * @param n Line number
 * @param context VSCode extension context
 * @returns the n-th line, or undefined on error
 */
export function getNthLineSync(filePath: string, n: number): string | undefined {
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

/**
 * Ensure that a directory exists and is empty.
 * - If it does not exist → creates it.
 * - If it exists but is not empty → throws an error (or optionally clears it).
 * @param dirPath Path to the directory to be checked
 * @param clearIfNotEmpty Should the directory be wiped out if not empty
 */
export function ensureEmptyDir(dirPath: string, clearIfNotEmpty = false): void {
	// If directory does not exist → create it
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		return;
	}

	// It exists → check contents
	const files = fs.readdirSync(dirPath);
	if (files.length === 0) {
		return; // Already empty
	}

	if (clearIfNotEmpty) {
		// Remove everything inside
		for (const file of files) {
			const filePath = path.join(dirPath, file);
			fs.rmSync(filePath, { recursive: true, force: true });
		}
	} else {
		// Fail if not empty
		throw new Error(`Installation folder "${dirPath}" is not empty.`);
	}
}
