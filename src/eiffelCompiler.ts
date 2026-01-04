import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { getOrInstallOrUpdateGoboEiffel } from './eiffelInstaller';
import { getNthLineSync } from './eiffelUtilities';
import { createNewGoboEiffelTerminal, executeInTerminal } from './eiffelTerminal';

const outputChannel = vscode.window.createOutputChannel("Gobo Eiffel compilation");
const goboEiffelDiagnostics = vscode.languages.createDiagnosticCollection('gobo-eiffel');

export function activateEiffelCompiler(context: vscode.ExtensionContext) {
	context.subscriptions.push(outputChannel);
	context.subscriptions.push(goboEiffelDiagnostics);

	const compileAndRunEiffelFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileAndRunEiffelFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
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

	const compileEiffelFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileEiffelFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
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

	const runEiffelFileCmd = vscode.commands.registerCommand('gobo-eiffel.runEiffelFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
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

	const lintEiffelFileCmd = vscode.commands.registerCommand('gobo-eiffel.lintEiffelFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let lintOptions = [];
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Compile Current Eiffel File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			lintOptions = config.compilationOptions ?? [];
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await lintEiffelSystem(filePath, undefined, lintOptions, environmentVariables, context);
	});
	context.subscriptions.push(lintEiffelFileCmd);

	const compileAndRunWithEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileAndRunWithEcfFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let ecfTarget = undefined;
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
			ecfTarget = config.ecfTarget;
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

		await compileAndRunEiffelSystem(filePath, ecfTarget, compilationOptions, buildDir, args, workingDir, environmentVariables, context);
	});
	context.subscriptions.push(compileAndRunWithEcfFileCmd);

	const compileWithEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.compileWithEcfFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let ecfTarget = undefined;
		let compilationOptions = [];
		let buildDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Compile With Current ECF File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			ecfTarget = config.ecfTarget;
			compilationOptions = config.compilationOptions ?? [];
			const configBuildDir = config.buildDir;
			buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await compileEiffelSystem(filePath, ecfTarget, compilationOptions, buildDir, environmentVariables, context);
	});
	context.subscriptions.push(compileWithEcfFileCmd);

	const runWithEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.runWithEcfFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let ecfTarget = undefined;
		let buildDir = defaultCwd;
		let args = [];
		let workingDir = defaultCwd;
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Run With Current ECF File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			ecfTarget = config.ecfTarget;
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

		await runEiffelSystemInTerminal(filePath, ecfTarget, buildDir, args, workingDir, environmentVariables, context);
	});
	context.subscriptions.push(runWithEcfFileCmd);

	const lintWithEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.lintWithEcfFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
		const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		let lintOptions = [];
		let environmentVariables = process.env;

		const debugConfigs = vscode.workspace.getConfiguration('launch').configurations as any[];
		const eiffelConfigs = debugConfigs.filter(c => c.type === 'eiffel');
		const configName = 'Compile With Current ECF File';
		const config = eiffelConfigs.find(c => c.name === configName);
		if (config) {
			lintOptions = config.compilationOptions ?? [];
			const userEnv = config.environmentVariables ?? {};
			environmentVariables = {...process.env, ...userEnv};
		} else {
			vscode.window.showInformationMessage(`Configure this command using the Launch config "${configName}"`);
		}

		await lintEiffelSystem(filePath, undefined, lintOptions, environmentVariables, context);
	});
	context.subscriptions.push(lintWithEcfFileCmd);

	const createEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.createEcfFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
		await createEcfFile(filePath, context);
	});
	context.subscriptions.push(createEcfFileCmd);

	const newGoboEiffelTerminalCmd = vscode.commands.registerCommand('gobo-eiffel.newGoboEiffelTerminal', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let filePath: string;
		if (uri) {
			// Command invoked from the Explorer context menu.
			filePath = uri.fsPath;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			filePath = editor.document.uri.fsPath;
		}
		const cwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
		await createNewGoboEiffelTerminal(cwd, process.env, context);
	});
	context.subscriptions.push(newGoboEiffelTerminalCmd);

	const selectAsWorkspaceEcfFileCmd = vscode.commands.registerCommand('gobo-eiffel.selectAsWorkspaceEcfFile', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let fileUri = undefined;
		if (uri) {
			// Command invoked from the Explorer context menu.
			fileUri = uri;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			fileUri = editor.document.uri;
		}
		let filePath = fileUri.fsPath;

		const ecfTargets = await getAllEcfTargets(filePath, context);
		if (!ecfTargets) {
			return;
		}

		let selectedTarget = undefined;
		switch (ecfTargets.length) {
			case 0:
				selectedTarget = "";
				break;
			case 1:
				selectedTarget = ecfTargets[0];
				break;
			default:
				selectedTarget = await vscode.window.showQuickPick(
					ecfTargets,
					{
						title: 'Select ECF target',
						placeHolder:  'Select ECF target',
						canPickMany: false
					}
				);
		}
		if (selectedTarget) {
			if (vscode.workspace.getWorkspaceFolder(fileUri)) {
				filePath = vscode.workspace.asRelativePath(fileUri, false).replace(/\\/g, '/');
			}
			await vscode.workspace.getConfiguration('gobo-eiffel').update('workspaceEcfFile', filePath, vscode.ConfigurationTarget.Workspace);
			await vscode.workspace.getConfiguration('gobo-eiffel').update('workspaceEcfTarget', selectedTarget, vscode.ConfigurationTarget.Workspace);
			vscode.commands.executeCommand(
				'workbench.action.openWorkspaceSettings',
				'ext:gobo-eiffel.workspaceEcf'
			);
		}
	});
	context.subscriptions.push(selectAsWorkspaceEcfFileCmd);
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

	let target = '';
	if (ecfTarget) {
		target = `'${ecfTarget}' from `;
	} else if (!filePath.endsWith('.e')) {
		const defaultTarget = await getDefaultEcfTarget(filePath, context);
		if (defaultTarget) {
			target = `'${defaultTarget}' from `;
		}
	}
	goboEiffelDiagnostics.clear();
	outputChannel.clear();
	outputChannel.show(true);
	outputChannel.appendLine(`Compiling ${target}${filePath}...`);

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
	if (buildDir !== workingDir) {
		exeFile = path.join(buildDir, exeFile);
	}
	await executeInTerminal(exeFile, args, workingDir, env, context);
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
 * Lint an Eiffel system or an Eiffel file.
 * See https://stackoverflow.com/questions/8503559/what-is-linting
 * See https://en.wikipedia.org/wiki/Lint_%28software%29
 * @param filePath ECF file used to describe the Eiffel system to lint, or Eiffel file to lint
 * @param ecfTarget Target in ECF file (default: last target in ECF file)
 * @param lintOptions Command-line options to be passed to the Eiffel Linter
 * @param env Environment variables for the Linter 
 * @param context VSCode extension context
 * @returns the exit code
 */
export async function lintEiffelSystem(
	filePath: string,
	ecfTarget: string | undefined,
	lintOptions: string[],
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext
): Promise<number> {

	const goboEiffelPath = await getOrInstallOrUpdateGoboEiffel(context);
	if (!goboEiffelPath) {
		return -1;
	}

	const gelintPath = path.join(goboEiffelPath, 'bin', 'gelint' + (os.platform() === 'win32' ? '.exe' : ''));
	try {
		if (!fs.existsSync(gelintPath)) {
			throw new Error(`file not found: ${gelintPath}`);
		}
		try {
			fs.accessSync(gelintPath, fs.constants.X_OK);
		} catch {
			throw new Error(`file is not executable: ${gelintPath}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Failed to launch Gobo Eiffel Lint: ${err.message}`);
		return -1;
	}

	let target = '';
	if (ecfTarget) {
		target = `'${ecfTarget}' from `;
	} else if (!filePath.endsWith('.e')) {
		const defaultTarget = await getDefaultEcfTarget(filePath, context);
		if (defaultTarget) {
			target = `'${defaultTarget}' from `;
		}
	}
	goboEiffelDiagnostics.clear();
	outputChannel.clear();
	outputChannel.show(true);
	outputChannel.appendLine(`Linting ${target}${filePath}...`);

	const cwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
	let error_code: number = 0;
	try {
		error_code = await spawnInOutputChannel(
			gelintPath,
			((ecfTarget) ? [`--target=${ecfTarget}`] : []).concat([...lintOptions, '--flat', filePath]),
			cwd,
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
 * Create an ECF file to compile the class contained in an Eiffel file.
 * @param filePath Eiffel file containing the root class
 * @param context VSCode extension context
 * @returns a Promise that resolves when the process exits.
 */
export async function createEcfFile(
	filePath: string,
	context: vscode.ExtensionContext
): Promise<void> {

	const goboEiffelPath = await getOrInstallOrUpdateGoboEiffel(context);
	if (!goboEiffelPath) {
		vscode.window.showErrorMessage(`Cannot run gedoc: Gobo Eiffel not installed`);
		return;
	}
	const gedocPath = path.join(goboEiffelPath, 'bin', 'gedoc' + (os.platform() === 'win32' ? '.exe' : ''));
	await executeInTerminal(gedocPath, ['--format=ecf_pretty_print', '--interactive', filePath], path.dirname(filePath), process.env, context);
	return;
}

/**
 * Get the executable name of the Eiffel system.
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
 * Get all targets in ECF file to be used for Eiffel compilations.
 * @param filePath ECF file used for the compilation.
 * @param context VSCode extension context
 * @returns the target name or undefined on error
 */
async function getAllEcfTargets(
	filePath: string, 
	context: vscode.ExtensionContext
): Promise<string[] | undefined> {

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
		cp.exec(`"${gedocPath}" --format=available_targets --no-benchmark "${filePath}"`, (err, stdout) => {
			if (err) {
				resolve(undefined);
			} else {
				let outBuffer = '';
				outBuffer += stdout.replace(/\r/g, '');
				let idx: number;
				let targets: string[] | undefined;
				while ((idx = outBuffer.indexOf('\n')) !== -1) {
					const line = outBuffer.slice(0, idx);
					outBuffer = outBuffer.slice(idx + 1);
					const match = line.match(/^(.*)/);
					if (match) {
						if (targets) {
							targets = [...targets, match[1]];
						} else {
							targets = [match[1]];
						}
					}
				}
				if (targets) {
					resolve(targets);
				} else {
					resolve(undefined);
				}
			}
		});
	});
}

/**
 * Get the default target in ECF file to be used for Eiffel compilations.
 * @param filePath ECF file used for the compilation.
 * @param context VSCode extension context
 * @returns the target name or undefined on error
 */
async function getDefaultEcfTarget(
	filePath: string, 
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
		cp.exec(`"${gedocPath}" --format=available_targets --no-benchmark "${filePath}"`, (err, stdout) => {
			if (err) {
				resolve(undefined);
			} else {
				let outBuffer = '';
				outBuffer += stdout.replace(/\r/g, '');
				let idx: number;
				let target: string | undefined;
				while ((idx = outBuffer.indexOf('\n')) !== -1) {
					const line = outBuffer.slice(0, idx);
					outBuffer = outBuffer.slice(idx + 1);
					const match = line.match(/^(.*)/);
					if (match) {
						target = match[1];
					}
				}
				if (target) {
					resolve(target);
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
 * Process Zig progress information (sent to stderr).
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
				const diagnosticsOnlyThroughLanguageServer: boolean = true;
				if (needDiagnosticsUpdate && !diagnosticsOnlyThroughLanguageServer) {
					goboEiffelDiagnostics.clear();
					for (const [file, diags] of diagnosticsByFile) {
						const uri = vscode.Uri.file(file);
						goboEiffelDiagnostics.set(uri, diags);
					}
				}
				diagnosticsByFile.clear;
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
					const matchCFile = line.match(/zig(\.exe)? clang (.*[\/\\])?([^\/\\]+\.[cS])/);
					const matchIgnore1 = line.match(/^(output path: )|(include dir: )|(def file: )|(\-Xclang)|(\-target-feature)/);
					const matchIgnore2 = line.match(/(\-Xclang)|(\-target-feature)/);
					if (matchCFile) {
						const cFile = matchCFile[3];
						outputChannel.appendLine(cFile);
					} else if (!matchIgnore1 && !matchIgnore2) {
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
