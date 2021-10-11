import { commands, ExtensionContext, LanguageClient, LanguageClientOptions, RequestType, ServerOptions, services, window, workspace } from 'coc.nvim';
import {ExecuteCommandParams, ExecuteCommandRegistrationOptions} from 'vscode-languageserver-protocol';
import * as fs from 'fs'

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

  const jumpToOtherFile = async () => {
    let document = await workspace.document;
    let file = document.uri

    await client.sendRequest(type, {
      command: 'als-other-file',
      arguments: [
        {
          uri: file,
        }
      ]
    });
  };

  context.subscriptions.push(services.registLanguageClient(client))

  const type = new RequestType<ExecuteCommandParams, any, void, ExecuteCommandRegistrationOptions>("workspace/executeCommand");
  context.subscriptions.push(
    commands.registerCommand('ada.otherFile', jumpToOtherFile),
  );
  workspace.registerKeymap(
    ['n'],
    'als-other-file',
    jumpToOtherFile,
    {sync: false}
  );
}


