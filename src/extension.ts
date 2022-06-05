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
		const commentTokenBegin = '// JulianGmp.openscad-formatter begin'
		const commentTokenEnd = '// JulianGmp.openscad-formatter end';
		const clangFormatOff = '// clang-format off'
		const clangFormatOn = '// clang-format on';
		const multiLineCommentBegin ='/*';
		const multiLineCommentEnd ='*/';

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
				const trimmed = split[i].trim();
				if (trimmed == commentTokenBegin) {
					// i points at the begin token, so we check that the following lines match
					// this ugly workaround's pattern
					assert(split[i + 1] === clangFormatOff);
					assert(split[i + 2] === multiLineCommentBegin);
					// [i + 3] points to the line that we excluded from formatting
					assert(split[i + 4] === multiLineCommentEnd);
					assert(split[i + 5] === clangFormatOn);
					assert(split[i + 6] === commentTokenEnd);

					// remove the current line (begin token) and the clangFormatOff
					split.splice(i, 3);
					// i now points towards the excluded line
					// remove the clangFormatOn and the ending token
					split.splice(i + 1, 3);
					// since i points at the excluded line and is increment in the next iteration,
					// we skip over that line. This is fine cause there's no point in checking it
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
		const formatProcess = child.execFile(command, args, format_process_callback);
		const clangFormatStdin = formatProcess.stdin;
		if (clangFormatStdin == null || !clangFormatStdin.writable) {
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
				clangFormatStdin.write(commentTokenBegin + eolCharacter);
				clangFormatStdin.write(clangFormatOff + eolCharacter);
				clangFormatStdin.write(multiLineCommentBegin + eolCharacter);
				clangFormatStdin.write(line.text + eolCharacter);
				clangFormatStdin.write(multiLineCommentEnd + eolCharacter);
				clangFormatStdin.write(clangFormatOn + eolCharacter);
				clangFormatStdin.write(commentTokenEnd + eolCharacter);
			} else {
				clangFormatStdin.write(line.text + eolCharacter);
			}
		}
		clangFormatStdin.end();
		await new Promise((resolve, _) => {
			formatProcess.on("close", resolve);
		});
	});
}


// this method is called when your extension is deactivated
export function deactivate() { }
