import { commands, ExtensionContext, LanguageClient, LanguageClientOptions, ServerOptions, services, window, workspace } from 'coc.nvim';
import * as coc from 'coc.nvim'
import * as fs from 'fs'
import {DependencyList, ALS_ShowDependenciesKind} from './lists';
import * as cmd from './commands'

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
    command: options.get<string>("serverBin") || 'ada_language_server',
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

  const jumpToOtherFile = cmd.jumpToOtherFile(client);

  context.subscriptions.push(
    services.registLanguageClient(client),
    commands.registerCommand('ada.otherFile', jumpToOtherFile),
    commands.registerCommand('ada.calledBy', cmd.calledBy(client)),
    commands.registerCommand('ada.calls', cmd.calls(client)),
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
