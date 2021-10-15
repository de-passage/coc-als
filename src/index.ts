import { commands, ExtensionContext, LanguageClient, LanguageClientOptions, Location, Range, RequestType, ServerOptions, services, window, workspace } from 'coc.nvim';
import * as coc from 'coc.nvim'
import {DocumentUri, ExecuteCommandParams, ExecuteCommandRegistrationOptions, TextDocumentPositionParams} from 'vscode-languageserver-protocol';
import * as fs from 'fs'
import {DependencyList, ALS_ShowDependenciesKind} from './lists';

const executeCommandType = new RequestType<ExecuteCommandParams, any, void, ExecuteCommandRegistrationOptions>("workspace/executeCommand");

interface ALSSubprogramAndReferences {
  location: Location;
  name : string;

  refs: Location[];
}

const requestCalledBy = new RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>("textDocument/alsCalledBy");
const requestCalls = new RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>("textDocument/alsCalls");

export type AlsReferenceKind = 'write' | 'access' | 'call' | 'dispatching call' | 'parent' | 'child';

export namespace AlsReferenceKind {
   export const Write            : AlsReferenceKind = 'write';
   export const Access           : AlsReferenceKind = 'access';
   export const Static_Call      : AlsReferenceKind = 'call';
   export const Dispatching_Call : AlsReferenceKind = 'dispatching call';
   export const Parent           : AlsReferenceKind = 'parent';
   export const Child            : AlsReferenceKind = 'child';
}

interface ALSLocation {
	uri: DocumentUri;
	range: Range;
  alsKind?: AlsReferenceKind[];
}

export async function activate(context: ExtensionContext): Promise<void> {

  let options = workspace.getConfiguration("ada");
  if (!options.get<boolean>("enable", true)) {
    return;
  }

  let projectFile = options.get<string>("projectFile", "");
  if (projectFile != "" && !fs.existsSync(projectFile)) {
    window.showErrorMessage(`Couldn't find project file '${projectFile}'`);
    return;
  }

  let projectFileInCurrentDir = fs.readdirSync('.').find((element)=> {
    element.endsWith(".gpr");
  });

  if (projectFileInCurrentDir !== undefined) {
    window.showMessage("Using '" + projectFileInCurrentDir + "' as project file");
  };

  const serverOptions : ServerOptions = {
    command: 'ada_language_server',
  }

  const clientOption : LanguageClientOptions = {
    documentSelector: ['ada'],
    synchronize: {
      configurationSection: 'ada'
    }
  }
  const client = new LanguageClient(
    'coc-als',
    'ada_language_server',
    serverOptions,
    clientOption
  )

  context.subscriptions.push(services.registLanguageClient(client))

  const makeCallRequest = (request : RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>) => {
    return async () => {
      let dc = await Promise.all<coc.Document, coc.Position>([workspace.document, window.getCursorPosition()])
      let document : coc.Document = dc[0];
      let cursor : coc.Position = dc[1];

      let r = await client.sendRequest(request, {
        textDocument: document.textDocument,
        position: cursor ,
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

  const calledBy = makeCallRequest(requestCalledBy)
  const calls = makeCallRequest(requestCalls)

  const jumpToOtherFile = async () => {
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

  context.subscriptions.push(
    commands.registerCommand('ada.otherFile', jumpToOtherFile),
    commands.registerCommand('ada.calledBy', calledBy),
    commands.registerCommand('ada.calls', calls),
    coc.listManager.registerList(new DependencyList(workspace.nvim, client, ALS_ShowDependenciesKind.Show_Importing)),
    coc.listManager.registerList(new DependencyList(workspace.nvim, client, ALS_ShowDependenciesKind.Show_Imported)),
  );
  workspace.registerKeymap(
    ['n'],
    'als-other-file',
    jumpToOtherFile,
    {sync: false}
  );
}


