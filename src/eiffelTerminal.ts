import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { quote } from 'shell-quote';
import { getOrInstallOrUpdateGoboEiffel } from './eiffelInstaller';

/**
 * Create a new Terminal where "${GOBO}/bin" is in the PATH.
 * @param cwd Where to run the Terminal
 * @param env Environment variables for the execution
 * @param context VSCode extension context
 * @returns the Terminal object.
 */
export async function createNewGoboEiffelTerminal(
	cwd: string,
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext
): Promise<vscode.Terminal> {
	// Add ${GOBO}/bin to the PATH.
	const goboPath = await getOrInstallOrUpdateGoboEiffel(context);
	if (goboPath) {
		const goboBin = path.join(goboPath, 'bin');
		let pathEnv = process.env.PATH;
		if (pathEnv) {
			pathEnv = `${goboBin}${process.platform === 'win32' ? ';' : ':'}${pathEnv}`;
		} else {
			pathEnv = goboBin;
		}
		env = { ...env, GOBO: goboPath, PATH: pathEnv };
	}

	const terminal = vscode.window.createTerminal({
		name: 'Gobo Eiffel',
		cwd: cwd,
		env: env
	});
	terminal.show();
	return terminal;
}

/**
 * Execute a program in the Terminal.
 * @param program Program to be executes
 * @param args Arguments to be passed to the executable
 * @param cwc Where to run the executable
 * @param env Environment variables for the execution
 * @param context VSCode extension context
 * @returns a Promise that resolves when the process exits.
 */
export async function executeInTerminal(
	program: string,
	args: string[],
	cwd: string,
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext
): Promise<void> {

	const fullPath = path.resolve(cwd, program);
	try {
		if (!fs.existsSync(fullPath)) {
			throw new Error(`file not found: ${program}`);
		}
		try {
			fs.accessSync(fullPath, fs.constants.X_OK);
		} catch {
			throw new Error(`file is not executable: ${program}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Cannot run executable: ${err.message}`);
		return;
	}

	let exeFile: string = program;
	const prefix = (os.platform() === 'win32' ? '.\\' : './');
	if (!path.isAbsolute(exeFile) && !exeFile.startsWith(prefix)) {
		exeFile = `${prefix}${exeFile}`;
	}
	if (program.includes(' ')) {
		exeFile = `."${exeFile}"`;
	}
	const quoted_args = quote(args).replace(/\-\-([a-zA-Z0-9\-_]+)\\=/g, (_, var1) => {
		// Make sure that command-line options of the form
		// '--foo=bar' are not escaped as '--foo\=bar'.
		return `--${var1}=`;
	});

	const exeCommand = `${exeFile} ${quoted_args}`;
	const terminal = await createNewGoboEiffelTerminal(cwd, env, context);
	terminal.sendText(exeCommand);
	return;
}
