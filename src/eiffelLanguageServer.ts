import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, NotificationType, RequestType } from 'vscode-languageclient/node';
import { getOrInstallOrUpdateGoboEiffel, selectOrDownloadAndInstall, getLocalGoboVersion, GoboVersion } from './eiffelInstaller';
import { getEnvironmentVariables } from './eiffelCompiler';
import { updateFormatView } from './eiffelFormatViewer';

interface FormatViewParams {
	uri: string;
}

interface FormatViewResult {
	uri: string;
	text: string;
}

let client: LanguageClient | undefined;
const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
let goboEiffelVersion: GoboVersion | undefined;
const eiffelBusyNotification = new NotificationType<{}>("$/goboEiffel/busy");
const eiffelNotBusyNotification = new NotificationType<{}>("$/goboEiffel/notBusy");
const eiffelRestartNotification = new NotificationType<{}>("$/goboEiffel/restart");
const eiffelFormatViewUpdateNotification = new NotificationType<{ uri: string, text: string }>("$/goboEiffel/formatViewUpdate");

export function activateEiffelLanguageServer(context: vscode.ExtensionContext) {
	// StatusBarItem for the status of the Gobo Eiffel Language Server.
	statusItem.command = "gobo-eiffel.showGoboEiffelMenu";
	statusItem.show();
	context.subscriptions.push(statusItem);

	// Start with initial config
	startLanguageServer(context);

	// Restart if environment variables are changed.
	vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration("gobo-eiffel.workspaceEnvironmentVariables")) {
			restartLanguageServer(context);
		}
	});

	// Command: restart with new config
	context.subscriptions.push(vscode.commands.registerCommand("gobo-eiffel.restartLanguageServer", async () => {
		await restartLanguageServer(context);
		if (statusItem.text.startsWith("$(check)")) {
			vscode.window.showInformationMessage("Gobo Eiffel Language Server restarted.");
		}
	}));

	const showGoboEiffelMenuCmd = vscode.commands.registerCommand("gobo-eiffel.showGoboEiffelMenu", async () => {
		const picked = await vscode.window.showQuickPick(
			[
				"Select Gobo Eiffel Installation...",
				"Restart Language Server"
			],
			{ placeHolder: "Gobo Eiffel Actions" }
		);
		if (!picked) {
			return;
		}
		switch (picked) {
			case "Select Gobo Eiffel Installation...":
				await selectOrDownloadAndInstall(context);
				break;
			case "Restart Language Server":
				await restartLanguageServer(context);
				break;
		}
	});
	context.subscriptions.push(showGoboEiffelMenuCmd);
}

export async function deactivateEiffelLanguageServer() {
	stopLanguageServer();
}

let startingLanguageServer: boolean = false;
const outputChannel = vscode.window.createOutputChannel("Gobo Eiffel LSP");
const traceOutputChannel = vscode.window.createOutputChannel("Gobo Eiffel LSP Trace");

export async function startLanguageServer(context: vscode.ExtensionContext, restart: boolean = false) {
	if (startingLanguageServer || client) {
		return;
	}
	startingLanguageServer = true;

	statusItem.text = `$(sync~spin) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	statusItem.tooltip = `Eiffel Language Server is ${((restart)?"re":"")}starting...\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to select another version...`;

	const goboEiffelPath = await getOrInstallOrUpdateGoboEiffel(context);
	if (!goboEiffelPath) {
		goboEiffelVersion = undefined;
		vscode.window.showErrorMessage(`Failed to launch Gobo Eiffel Language Server: Gobo Eiffel not installed.`);
		statusItem.text = "$(error) Gobo Eiffel";
		statusItem.tooltip = "Gobo Eiffel not installed\nClick to install...";
		startingLanguageServer = false;
		return;
	}

	goboEiffelVersion = await getLocalGoboVersion(goboEiffelPath);
	statusItem.text = `$(sync~spin) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	statusItem.tooltip = `Eiffel Language Server is ${((restart)?"re":"")}starting...\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to select another version...`;

	const gelsp = path.join(goboEiffelPath, 'bin', 'gelsp' + (os.platform() === 'win32' ? '.exe' : ''));
	try {
		if (!fs.existsSync(gelsp)) {
			throw new Error(`file not found: ${gelsp}`);
		}
		try {
			fs.accessSync(gelsp, fs.constants.X_OK);
		} catch {
			throw new Error(`file is not executable: ${gelsp}`);
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`Failed to launch Gobo Eiffel Language Server: ${err.message}`);
		statusItem.text = `$(error) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
		statusItem.tooltip = `No Eiffel Language Server found\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to select another version...`;
		startingLanguageServer = false;
		return;
	}

	const serverOptions: ServerOptions = {
		run: { command: gelsp, args: [], transport: TransportKind.stdio, options: { env: await getEnvironmentVariables(context) } },
		debug: { command: gelsp, args: ["--debug"], transport: TransportKind.stdio, options: { env: await getEnvironmentVariables(context) } }
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'eiffel' }, { scheme: 'eiffel', language: 'eiffel' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.e')
		},
		outputChannel: outputChannel,
		traceOutputChannel: traceOutputChannel
	};

	client = new LanguageClient(
		'goboEiffelLsp',
		'Gobo Eiffel Language Server',
		serverOptions,
		clientOptions
	);
	context.subscriptions.push(client);

	client.onNotification("$/goboEiffel/formatViewUpdate", (params: FormatViewResult) => {
		const parsedUri = vscode.Uri.parse(params.uri);
		updateFormatView(parsedUri, params.text);
	});

	client.onNotification(eiffelBusyNotification, () => {
		statusItem.text = `$(sync~spin) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	});

	client.onNotification(eiffelNotBusyNotification, () => {
		statusItem.text = `$(check) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	});

	client.onNotification(eiffelRestartNotification, () => {
		restartLanguageServer(context);
	});
	startingLanguageServer = false;
	
	// Start server and update status bar
	client.start().then(() => {
		statusItem.tooltip = `Eiffel Language Server is running\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to restart or select another version...`;
	}).catch((err) => {
		vscode.window.showErrorMessage(`Gobo Eiffel Language Server failed to start: ${err.message}`);
		statusItem.text = `$(error) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
		statusItem.tooltip = `Eiffel Language Server failed to start:\n${err.message}\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to restart or select another version...`;
	});
}

export async function restartLanguageServer(context: vscode.ExtensionContext) {
	await stopLanguageServer();
	await startLanguageServer(context, true);
}

export async function stopLanguageServer() {
	try {
		if (client) {
			const oldClient = client;
			client = undefined;
			// The `stop` call will send the "shutdown" notification to the LSP.
			await oldClient.stop();
			// The `dispose` call will send the "exit" request to the LSP which actually tells the child process to exit.
			await oldClient.dispose();

		}
	} catch {
	}
	statusItem.text = `$(circle-slash) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	statusItem.tooltip = `Eiffel Language Server stopped\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to restart or select another version...`;
}

const FormatViewRequest = new RequestType<FormatViewParams, FormatViewResult, void >('$/goboEiffel/formatView');

/**
 * Get a format view of a class or feature.
 * @param uri URI of the requested format view
 * @returns the text of the requested format view
 */
export async function getFormatView(uri: vscode.Uri): Promise<string> {
	if (client) {
		const result = await client.sendRequest<FormatViewResult>('$/goboEiffel/formatView', { uri: uri.toString() });
		return result.text;
	}
	const match = uri.path.match(/ - ([^/]* View)$/);
	vscode.window.showErrorMessage(`${match ? match[1]+": " : ""}Eiffel Language Server not running.`);
	return "";
}

interface SourceDefinitionResult {
	uri: string;
	range: {
		start: {
			line: number;
			character: number;
		};
		end: {
			line: number;
			character: number;
		};
	}
}

/**
 * Get definition location of a text element in its source class.
 * @param uri URI of the document containing the source element.
 * @param position position of the source element in the document.
 */
export async function getSourceDefinition(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Location | null> {
	if (client) {
		const result = await client.sendRequest<SourceDefinitionResult | SourceDefinitionResult[] | null>('$/goboEiffel/sourceDefinition', {
			textDocument: {uri: uri.toString()},
			position: {line: position.line, character: position.character}
		});
		const location = Array.isArray(result) ? result[0] : result;
		if (location) {
			return new vscode.Location (
				vscode.Uri.parse(location.uri),
				new vscode.Range(
					new vscode.Position(location.range.start.line, location.range.start.character),
					new vscode.Position(location.range.end.line, location.range.end.character)
				)
			);
		}
	}
	return null;
}
