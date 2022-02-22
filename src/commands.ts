import {ExecuteCommandParams, ExecuteCommandRegistrationOptions, TextDocumentPositionParams} from "vscode-languageserver-protocol";
import {commands, Document, LanguageClient, Location, Position, RequestType, window, workspace} from 'coc.nvim'

const executeCommandType = new RequestType<ExecuteCommandParams, any, void, ExecuteCommandRegistrationOptions>("workspace/executeCommand");

interface ALSSubprogramAndReferences {
  location: Location;
  name: string;

  refs: Location[];
}

const requestCalledBy = new RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>("textDocument/alsCalledBy");
const requestCalls = new RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>("textDocument/alsCalls");


export const jumpToOtherFile = (client: LanguageClient) => async () => {
  let document = await workspace.document;
  let file = document.uri

  await client.sendRequest(executeCommandType, {
    command: 'als-other-file',
    arguments: [
      {
        uri: file,
      }
    ]
  });
};

const makeCallRequest = (request: RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>) => (client: LanguageClient) => {
  return async () => {
    let dc = await Promise.all<Document, Position>([workspace.document, window.getCursorPosition()])
    let document: Document = dc[0];
    let cursor: Position = dc[1];

    let r = await client.sendRequest(request, {
      textDocument: document.textDocument,
      position: cursor,
    });

    if (!r) {
      window.showErrorMessage("command failed");
      return;
    } else if (r.length === 0) {
      window.showMessage("Nothing found");
      return;
    }

    commands.executeCommand('editor.action.showReferences', r[0].location.uri, r[0].location.range.start, r[0].refs);
  };
}

export const calledBy = makeCallRequest(requestCalledBy)
export const calls = makeCallRequest(requestCalls)
