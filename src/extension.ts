import * as vscode from 'vscode';
import * as child from 'child_process';

const EXTENSION_NAME = 'openscad-formatter';
const CFG_CLANG_FORMAT_EXECUTABLE = 'clang-format.executable';
const CFG_CLANG_FORMAT_STYLE = 'clang-format.style';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider({ language: 'scad' }, {
			provideDocumentFormattingEdits: (document, options) => {
				return open_scad_format(document, options);
			}
		})
	);
}


function open_scad_format
	(document: vscode.TextDocument, options: vscode.FormattingOptions): Promise<vscode.TextEdit[]> {
	return new Promise<vscode.TextEdit[]>(async (resolve, _) => {
		const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
		const command = config.get<string>(CFG_CLANG_FORMAT_EXECUTABLE);
		const style = config.get<string>(CFG_CLANG_FORMAT_STYLE);
		if (command == undefined || style == undefined) {
			// throw error
			resolve([]);
			return;
		}
		const args = [
			'--style', style,
			'--assume-filename', document.fileName
		];

		function format_process_callback(error: child.ExecException | null, stdout: string, stderr: string) {
			if (error != null) {
				vscode.window.showErrorMessage(`Error when formatting file (${error}):\n${stderr}`);
				resolve([]);
				return;
			}
			// generate full document's range
			const range = new vscode.Range(
				document.lineAt(0).range.start,
				document.lineAt(document.lineCount - 1).range.end
			);
			resolve([new vscode.TextEdit(range, stdout)]);
		}

		const format_process = child.execFile(command, args, format_process_callback);
		const stdin = format_process.stdin;
		if (stdin == null || !stdin.writable) {
			vscode.window.showErrorMessage("Error when running clang-format process: stdin is not writable!");
			resolve([]);
			return;
		}
		stdin.write(document.getText());
		stdin.end();
		await new Promise((resolve, _) => {
			format_process.on("close", resolve);
		});
	});
}


// this method is called when your extension is deactivated
export function deactivate() { }
