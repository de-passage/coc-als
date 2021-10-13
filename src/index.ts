import { commands, ExtensionContext, LanguageClient, LanguageClientOptions, listManager, Location, Range, RequestType, ServerOptions, services, TextDocumentIdentifier, window, workspace } from 'coc.nvim';
import * as coc from 'coc.nvim'
import {DocumentUri, ExecuteCommandParams, ExecuteCommandRegistrationOptions, TextDocumentPositionParams} from 'vscode-languageserver-protocol';
import * as lsp from 'vscode-languageserver-protocol'
import * as fs from 'fs'

const executeCommandType = new RequestType<ExecuteCommandParams, any, void, ExecuteCommandRegistrationOptions>("workspace/executeCommand");

interface ALSSubprogramAndReferences {
  loc: Location;
  name : string;

  refs: Location[];
}

const requestCalledBy = new RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>("textDocument/alsCalledBy");
const requestCalls = new RequestType<TextDocumentPositionParams, ALSSubprogramAndReferences[], void>("textDocument/alsCalls");


namespace ALS_ShowDependenciesKind {
  export type Kind = number;
  export const Show_Imported : Kind = 1;
  export const Show_Importing : Kind = 2;
}

interface ALS_ShowDependenciesParams {
  textDocument : TextDocumentIdentifier; /* The queried unit */
  kind         : ALS_ShowDependenciesKind.Kind; /* The dependencies query kind */
  showImplicit : boolean; /* True if implicit dependencies should be returned */
}

interface ALS_Unit_Description {
  uri        : DocumentUri; /* The dependency unit's file */
  projectUri : DocumentUri; /* The dependency's project file */
}

const requestshowDependencies = new RequestType<ALS_ShowDependenciesParams, ALS_Unit_Description[], void>("textDocument/alsShowDependencies");

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

  const calledBy = async () => {
    let document = await workspace.document;
    let cursor = await window.getCursorPosition();

    let r = await client.sendRequest(requestCalledBy, {
      textDocument: document.textDocument,
      position: cursor ,
    });

    if (!r) {
      window.showErrorMessage("command failed");
    }

    window.showMessage(JSON.stringify(r));

  }

  const calls = async () => {

    let dc = await Promise.all<coc.Document, coc.Position>([workspace.document, window.getCursorPosition()])
    let document : coc.Document = dc[0];
    let cursor : coc.Position = dc[1];

    let r = await client.sendRequest(requestCalls, {
      textDocument: document.textDocument,
      position: cursor ,
    });

    if (!r) {
      window.showErrorMessage("command failed");
    }

    window.showMessage(JSON.stringify(r));

  }

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

  const showDependencies = (kind: ALS_ShowDependenciesKind.Kind) => async () => {
    let document = await workspace.document;

    let r = await client.sendRequest(requestshowDependencies, {
      textDocument: document.textDocument,
      kind: kind,
      showImplicit: true,
    });

    if (!r) {
      window.showErrorMessage("command failed");
    }

  }

  context.subscriptions.push(
    commands.registerCommand('ada.otherFile', jumpToOtherFile),
    commands.registerCommand('ada.calledBy', calledBy),
    commands.registerCommand('ada.calls', calls),
    commands.registerCommand('ada.showImported', showDependencies(ALS_ShowDependenciesKind.Show_Imported)),
    commands.registerCommand('ada.showImporting', showDependencies(ALS_ShowDependenciesKind.Show_Importing)),
  );
  workspace.registerKeymap(
    ['n'],
    'als-other-file',
    jumpToOtherFile,
    {sync: false}
  );
}


