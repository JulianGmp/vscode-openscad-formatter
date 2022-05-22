import * as vscode from 'vscode';
import * as child from 'child_process';
import { assert } from 'console';

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
	(document: vscode.TextDocument, _: vscode.FormattingOptions): Promise<vscode.TextEdit[]> {
	return new Promise<vscode.TextEdit[]>(async (resolve, _) => {
		const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
		const command = config.get<string>(CFG_CLANG_FORMAT_EXECUTABLE);
		const style = config.get<string>(CFG_CLANG_FORMAT_STYLE);

		// the end of line character used in the document.
		let eolCharacter: string;
		switch (document.eol) {
			case vscode.EndOfLine.CRLF:
				eolCharacter = '\r\n';
				break;
			case vscode.EndOfLine.LF:
				eolCharacter = '\n';
				break;
		}
		if (eolCharacter.length == 0) {
			vscode.window.showErrorMessage(`Error when parsing the file's end of line character '${document.eol.toString()}', please report this to the extension author.`);
			resolve([]);
			return;
		}

		if (command == undefined || style == undefined) {
			// throw error
			resolve([]);
			return;
		}

		// command line args for clang-format
		let args: string[] = ['--style', style];
		if (document.uri.scheme == 'file') {
			args.push('--assume-filename', document.uri.fsPath);
		}

		// Comment token for include and use statements that have been disabled for formatting
		const commentToken = '// JulianGmp.openscad-formatter token';
		const includePrefix = '#';

		// this function is ran once clang-format finished
		function format_process_callback(error: child.ExecException | null, stdout: string, stderr: string) {
			if (error != null) {
				vscode.window.showErrorMessage(`Error when formatting file (${error}):\n${stderr}`);
				resolve([]);
				return;
			}
			// we need to change back any includes we modified
			// for that we split the string that is the entire output file. Im sure that
			// wont have any performance implications :)
			let split = stdout.split(eolCharacter);
			for (let i = 0; i < split.length; i++) {
				if (split[i].startsWith(commentToken)) {
					// remove the token line
					split.splice(i, 1);
					// i now points towards the next line, which has the include statement
					// we just need to remove the '#' prefix from it and boom this ugly workaround is done.
					assert(split[i].startsWith(`${includePrefix}include`));
					split[i] = split[i].substring(1);
				}
			}

			// generate full document's range
			const range = new vscode.Range(
				document.lineAt(0).range.start,
				document.lineAt(document.lineCount - 1).range.end
			);
			resolve([new vscode.TextEdit(range, split.join(eolCharacter))]);
		}

		console.debug(`${EXTENSION_NAME}: running clang-format with args: [ ${args.join(' ')} ].`);
		const format_process = child.execFile(command, args, format_process_callback);
		const stdin = format_process.stdin;
		if (stdin == null || !stdin.writable) {
			vscode.window.showErrorMessage("Error when running clang-format process: stdin is not writable!");
			resolve([]);
			return;
		}

		// to filter out include and use lines we have to pass the file line by line,
		// prepenend the includes with a comment line to find them later and use
		// a '#' before the include so that clang-tidy doesn't mess with them.
		for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
			let line = document.lineAt(lineIndex);
			let lineTrimmed = line.text.trimStart();
			if (lineTrimmed.startsWith('include') || lineTrimmed.startsWith('use')) {
				stdin.write(commentToken);
				stdin.write(eolCharacter);
				stdin.write(includePrefix + line.text);
				stdin.write(eolCharacter);
			} else {
				stdin.write(line.text);
				stdin.write(eolCharacter);
			}
		}
		stdin.end();
		await new Promise((resolve, _) => {
			format_process.on("close", resolve);
		});
	});
}


// this method is called when your extension is deactivated
export function deactivate() { }
