import * as vscode from 'vscode';
import { getFormatView, getSourceDefinition } from './eiffelLanguageServer';
import { openFileInEditor } from './eiffelUtilities';

class EiffelVirtualDocumentProvider
	implements vscode.TextDocumentContentProvider
{
	private readonly contents = new Map<string, string>();

	private readonly changeEmitter =
		new vscode.EventEmitter<vscode.Uri>();

	public readonly onDidChange = this.changeEmitter.event;

	public async provideTextDocumentContent(
		uri: vscode.Uri,
		token: vscode.CancellationToken
	): Promise<string> {
		const cached = this.contents.get(uri.toString());
		if (cached !== undefined) {
			return cached;
		}
		const text = await getFormatView(uri);
		this.contents.set(uri.toString(), text);
		return text;
	}

	public setContent(uri: vscode.Uri, text: string): void {
		const key = uri.toString();

		this.contents.set(key, text);
		this.changeEmitter.fire(uri);
	}
}

const eiffelVirtualDocumentProvider = new EiffelVirtualDocumentProvider();

export function activateEiffelFormatViewer(context: vscode.ExtensionContext) {
	context.subscriptions.push( vscode.workspace.registerTextDocumentContentProvider('eiffel', eiffelVirtualDocumentProvider));

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(async document => {
			if (document.uri.scheme === 'eiffel' && document.languageId !== 'eiffel') {
				await vscode.languages.setTextDocumentLanguage(document, 'eiffel' );
			}
		})
	);

	const showContractViewCmd = vscode.commands.registerCommand('gobo-eiffel.showContractView', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let viewUri: vscode.Uri;
		if (uri) {
			// Command invoked from the Explorer context menu.
			viewUri = uri;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			viewUri = editor.document.uri;
		}
		const viewUriPath = viewUri.path.replace(/ - [^/]* View$/, '');
		viewUri = vscode.Uri.parse(`eiffel://${viewUriPath} - Contract View`);
		await showFormatView(viewUri);
	});
	context.subscriptions.push(showContractViewCmd);

	const showFlatContractViewCmd = vscode.commands.registerCommand('gobo-eiffel.showFlatContractView', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let viewUri: vscode.Uri;
		if (uri) {
			// Command invoked from the Explorer context menu.
			viewUri = uri;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			viewUri = editor.document.uri;
		}
		const viewUriPath = viewUri.path.replace(/ - [^/]* View$/, '');
		viewUri = vscode.Uri.parse(`eiffel://${viewUriPath} - Flat Contract View`);
		await showFormatView(viewUri);
	});
	context.subscriptions.push(showFlatContractViewCmd);

	const showClassTextCmd = vscode.commands.registerCommand('gobo-eiffel.showClassText', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		let viewUri: vscode.Uri;
		if (uri) {
			// Command invoked from the Explorer context menu.
			viewUri = uri;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			viewUri = editor.document.uri;
		}
		const filePath = viewUri.path.replace(/ - [^/]* View$/, '');
		await openFileInEditor(filePath);
	});
	context.subscriptions.push(showClassTextCmd);

	const goToSourceDefinitionCmd = vscode.commands.registerCommand('gobo-eiffel.goToSourceDefinition', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const documentUri = editor.document.uri;
		const position = editor.selection.active;

		await goToSourceDefinition(documentUri, position);
	});
	context.subscriptions.push(goToSourceDefinitionCmd);
}

/**
 * Show a format view of a class or feature.
 * @param uri URI of the requested format view
 */
async function showFormatView(uri: vscode.Uri) {
	const text = await getFormatView(uri);
	eiffelVirtualDocumentProvider.setContent(uri, text);
	const document = await vscode.workspace.openTextDocument(uri);
	if (document.languageId !== 'eiffel') {
		await vscode.languages.setTextDocumentLanguage(document, 'eiffel');
	}
	await vscode.window.showTextDocument(document, { preview: false });
}

/**
 * Update a format view of a class or feature.
 * @param uri URI of the format view
 * @param text New text of the format view 
 */
export function updateFormatView(uri: vscode.Uri, text: string) {
	eiffelVirtualDocumentProvider.setContent(uri, text);
}

/**
 * Go to the definition of a text element in its source class.
 * @param uri URI of the document containing the source element.
 * @param position position of the source element in the document.
 */
async function goToSourceDefinition(uri: vscode.Uri, position: vscode.Position) {
	const location = await getSourceDefinition(uri, position);
	if (location) {
		try {
			const document = await vscode.workspace.openTextDocument(location.uri);
			await vscode.window.showTextDocument(document, {
				selection: new vscode.Range(location.range.start, location.range.start)
			});
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to open file: ${err}`);
		}
	}
}
