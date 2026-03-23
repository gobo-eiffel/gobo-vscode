// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { activateEiffelLanguageServer, deactivateEiffelLanguageServer } from './eiffelLanguageServer';
import { activateEiffelInstaller } from './eiffelInstaller';
import { activateEiffelCompiler, setInitialWorkspaceEcfFile } from './eiffelCompiler';
import { activateEiffelDebugAdapter } from './eiffelDebugAdapter';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Set the initial workspace ECF file before launching the LSP server.
	await setInitialWorkspaceEcfFile(context);
	activateEiffelLanguageServer(context);
	activateEiffelInstaller(context);
	activateEiffelCompiler(context);
	activateEiffelDebugAdapter(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
	deactivateEiffelLanguageServer();
}
