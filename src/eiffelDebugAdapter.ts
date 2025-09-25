import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { compileEiffelSystem, getExecutableName } from './eiffelCompiler';
import { expandEnvVars } from './eiffelUtilities';

export function activateEiffelDebugAdapter(context: vscode.ExtensionContext) {
	// Register debug configuration provider
	const provider: vscode.DebugConfigurationProvider = {
		async resolveDebugConfiguration(folder, config, token) {
			// Add missing parts to the Launch config before executing it.
			config = config || {};
			if (!config.type) {
				config.type = 'eiffel';
			}
			if (!config.name) {
				config.name = 'Compile & Run Eiffel System';
			}
			if (!config.request) {
				config.request = 'launch';
			}
			if (!config.ecfFile) {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showErrorMessage('No active editor to run');
					return undefined;
				}
				config.ecfFile = editor.document.fileName;
			} else {
				config.ecfFile = await expandEnvVars(config.ecfFile, process.env, context);
			}
			if (config.buildDir) {
				config.buildDir = await expandEnvVars(config.buildDir, process.env, context);
			}
			if (config.workingDir) {
				config.workingDir = await expandEnvVars(config.workingDir, process.env, context);
			}
			return config;
		}
	};
	context.subscriptions.push(
		vscode.debug.registerDebugConfigurationProvider('eiffel', provider)
	);

	// Register debug adapter factory
	const factory: vscode.DebugAdapterDescriptorFactory = {
		createDebugAdapterDescriptor(session: vscode.DebugSession) {
			// Minimal stub DebugAdapter
			const emitter = new vscode.EventEmitter<vscode.DebugProtocolMessage>();
			const runCtx: RunContext = {};

			const stubAdapter: vscode.DebugAdapter = {
				onDidSendMessage: emitter.event, // <-- required property
				handleMessage: (message: any) => {
					// Only handle requests.
					if (message?.type !== 'request') {
						return;
					}
					const cmd = message.command;
					// Action when the Stop button is pressed.
					if (cmd === 'disconnect') {
						if (runCtx.child) {
							try { runCtx.child.kill(); } catch (e) { /* ignore */ }
						}
						// Acknowledge disconnect request
						emitter.fire({
							type: 'response',
							request_seq: message.seq,
							success: true,
							command: 'disconnect'
						});
						// End session
						emitter.fire({ type: 'event', event: 'terminated', body: {} });
						return;
					}

					// Send the input from Debug Console to the program stdin.
					if (cmd === 'evaluate') {
						const expr: string | undefined = message.arguments?.expression;
						const context: string | undefined = message.arguments?.context;

						// Only treat REPL evaluate as stdin input (guard by context if you want)
						if (typeof expr === 'string' && (context === 'repl' || context === undefined)) {
							if (runCtx.child?.stdin && runCtx.child.stdin.writable) {
								// Send the expression as a line to stdin
								runCtx.child.stdin.write(expr + '\n');
							}
							// Respond to the evaluate request so VSCode is happy
							emitter.fire({
								type: 'response',
								request_seq: message.seq,
								success: true,
								command: 'evaluate',
								body: { result: '', variablesReference: 0 }
							});
						} else {
							// Not handled — send a default response
							emitter.fire({
								type: 'response',
								request_seq: message.seq,
								success: true,
								command: 'evaluate',
								body: { result: '', variablesReference: 0 }
							});
						}
						return;
					}
					// Older/custom 'input' request fallback (some clients)
					if (cmd === 'input') {
						const inputData = message.arguments?.text ?? '';
						if (runCtx.child?.stdin && runCtx.child.stdin.writable) {
							runCtx.child.stdin.write(inputData + '\n');
						}
						emitter.fire({
							type: 'response',
							request_seq: message.seq,
							success: true,
							command: 'input'
						});
						return;
					}
				},
				dispose: () => emitter.dispose()
			};

			const filePath = session.configuration.ecfFile ?? '';
			const defaultCwd = ((fs.existsSync(filePath)) ? path.dirname(filePath) : '.');
			const ecfTarget = session.configuration.ecfTarget;
			const compilationOptions = session.configuration.compilationOptions ?? [];
			const configBuildDir = session.configuration.buildDir;
			const buildDir = ((configBuildDir) ? configBuildDir : defaultCwd);
			const args = session.configuration.args ?? [];
			const configWorkingDir = session.configuration.workingDir;
			const workingDir = ((configWorkingDir) ? configWorkingDir : defaultCwd);
			const userEnv = session.configuration.environmentVariables ?? {};
			const environmentVariables = {...process.env, ...userEnv};
			const compileOnly = session.configuration.compileOnly ?? false;
			const runOnly = session.configuration.runOnly ?? false;

			if (runOnly) {
				runEiffelSystemInDebugConsole(filePath, ecfTarget, buildDir, args, workingDir, environmentVariables, context, emitter, runCtx);
			} else {
				compileEiffelSystem(filePath, ecfTarget, compilationOptions, buildDir, environmentVariables, context).then((code) => {
					if (!compileOnly && code === 0) {
						runEiffelSystemInDebugConsole(filePath, ecfTarget, buildDir, args, workingDir, environmentVariables, context, emitter, runCtx);
					} else {
						// End session
						emitter.fire({ type: 'event', event: 'terminated', body: {} });
					}
				});
			}

			return new vscode.DebugAdapterInlineImplementation(stubAdapter);
		}
	};

	context.subscriptions.push(
		vscode.debug.registerDebugAdapterDescriptorFactory('eiffel', factory)
	);
}

interface RunContext {
	child?: cp.ChildProcessWithoutNullStreams;
}

/**
 * Run an already-compiled Eiffel system in the Debug Console.
 * @param filePath ECF file used for the compilation, or Eiffel file compiled
 * @param ecfTarget Target in ECF file (default: last target in ECF file)
 * @param buildDir Where to compile the executable
 * @param args Arguments to be passed to the executable
 * @param workingdDir Where to run the executable
 * @param env Environment variables for the execution
 * @param context VSCode extension context
 * @param emitter VSCode Event emitter
 * @param runCtx contains the child process being executed (so that we can kill it from outside this function)
 * @returns a Promise that resolves when the process exits.
 */
async function runEiffelSystemInDebugConsole(
	filePath: string,
	ecfTarget: string | undefined,
	buildDir: string,
	args: string[],
	workingdDir: string,
	env: NodeJS.ProcessEnv,
	context: vscode.ExtensionContext,
	emitter: vscode.EventEmitter<vscode.DebugProtocolMessage>,
	runCtx: RunContext
): Promise<void> {
	// Ensure the Debug Console (REPL) is visible
	vscode.commands.executeCommand('workbench.debug.action.toggleRepl');

	const name = await getExecutableName(filePath, ecfTarget, context);
	if (!name) {
		vscode.window.showErrorMessage(`No executable name found for ${filePath}`);
		emitter.fire({
			type: 'event',
			event: 'output',
			body: {
				category: 'console',
				output: `No executable name found for ${filePath}\n`
			}
		});
		emitter.fire({ type: 'event', event: 'terminated', body: {} });
		return;
	}

	const exeFile = path.join(buildDir, name + (os.platform() === 'win32' ? '.exe': ''));
	try {
		if (!fs.existsSync(exeFile)) {
			throw new Error(`file not found: ${exeFile}`);
		}
		try {
			fs.accessSync(exeFile, fs.constants.X_OK);
		} catch {
			throw new Error(`file is not executable: ${exeFile}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Failed to launch program: ${err.message}`);
		emitter.fire({
			type: 'event',
			event: 'output',
			body: {
				category: 'console',
				output: `Failed to launch program: ${err.message}\n`
			}
		});
		emitter.fire({ type: 'event', event: 'terminated', body: {} });
		return;
	}

	const child = cp.spawn(exeFile, args, {
		cwd: workingdDir,
		env: env,
		stdio: ['pipe', 'pipe', 'pipe']
	});
	runCtx.child = child;

	// stdout → Debug Console
	child.stdout.on('data', (data) => {
		emitter.fire({
			type: 'event',
			event: 'output',
			body: {
				category: 'stdout',
				output: data.toString()
			}
		});
	});

	// stderr → Debug Console
	child.stderr.on('data', (data) => {
		emitter.fire({
			type: 'event',
			event: 'output',
			body: {
				category: 'stderr',
				output: data.toString()
			}
		});
	});

	child.on('exit', (code) => {
		emitter.fire({
			type: 'event',
			event: 'output',
			body: {
				category: 'console',
				output: `\nProcess exited with code ${code}\n`
			}
		});
		emitter.fire({ type: 'event', event: 'terminated', body: {} });
	});
}
