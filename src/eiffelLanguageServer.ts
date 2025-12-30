import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, NotificationType } from 'vscode-languageclient/node';
import { getOrInstallOrUpdateGoboEiffel, selectOrDownloadAndInstall, getLocalGoboVersion, GoboVersion } from './eiffelInstaller';

let server: LanguageClient | undefined;
const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
let goboEiffelVersion: GoboVersion | undefined;
const eiffelBusyNotification = new NotificationType<{}>("$/goboEiffel/busy");
const eiffelNotBusyNotification = new NotificationType<{}>("$/goboEiffel/notBusy");
const eiffelRestartNotification = new NotificationType<{}>("$/goboEiffel/restart");

export function activateEiffelLanguageServer(context: vscode.ExtensionContext) {
	// StatusBarItem for the status of the Gobo Eiffel Language Server.
	statusItem.command = "gobo-eiffel.showGoboEiffelMenu";
	statusItem.show();
	context.subscriptions.push(statusItem);

	// Start with initial config
	startLanguageServer(context);

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
const outputChannel = vscode.window.createOutputChannel("Gobo Eiffel LSP Trace");


export async function startLanguageServer(context: vscode.ExtensionContext, restart: boolean = false) {
	if (startingLanguageServer) {
		return;
	}
	statusItem.text = `$(sync~spin) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	statusItem.tooltip = `Eiffel Language Server is ${((restart)?"re":"")}starting...\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to select another version...`;

	startingLanguageServer = true;
	const goboEiffelPath = await getOrInstallOrUpdateGoboEiffel(context);
	startingLanguageServer = false;

	if (!goboEiffelPath) {
		goboEiffelVersion = undefined;
		vscode.window.showErrorMessage(`Failed to launch Gobo Eiffel Language Server: Gobo Eiffel not installed.`);
		statusItem.text = "$(error) Gobo Eiffel";
		statusItem.tooltip = "Gobo Eiffel not installed\nClick to install...";
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
		return;
	}

	const serverOptions: ServerOptions = {
		run: { command: gelsp, args: [], transport: TransportKind.stdio },
		debug: { command: gelsp, args: ["--debug"], transport: TransportKind.stdio }
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'eiffel' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.e')
		},
		outputChannelName: "Gobo Eiffel LSP",
		traceOutputChannel: outputChannel
	};

	server = new LanguageClient(
		'goboEiffelLsp',
		'Gobo Eiffel Language Server',
		serverOptions,
		clientOptions
	);
	// server.setTrace(Trace.Verbose);
	context.subscriptions.push(server);

	server.onNotification(eiffelBusyNotification, () => {
		statusItem.text = `$(sync~spin) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	});

	server.onNotification(eiffelNotBusyNotification, () => {
		statusItem.text = `$(check) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	});

	server.onNotification(eiffelRestartNotification, () => {
		restartLanguageServer(context);
	});

	// Start server and update status bar
	server.start().then(() => {
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
	if (server) {
		const oldServer = server;
		server = undefined;
		// The `stop` call will send the "shutdown" notification to the LSP.
		await oldServer.stop();
		// The `dipose` call will send the "exit" request to the LSP which actually tells the child process to exit.
		await oldServer.dispose();

	}
	statusItem.text = `$(circle-slash) Gobo Eiffel${((goboEiffelVersion)?" "+goboEiffelVersion.shortVersion:"")}`;
	statusItem.tooltip = `Eiffel Language Server stopped\n${((goboEiffelVersion)?"Gobo Eiffel "+goboEiffelVersion.longVersion+"\n":"")}Click to restart or select another version...`;
}
