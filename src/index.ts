import { commands, CompleteResult, ExtensionContext, LanguageClient, LanguageClientOptions, services, window, workspace } from 'coc.nvim';

export async function activate(context: ExtensionContext): Promise<void> {

  window.showMessage ("Configuration: ");
  let options = workspace.getConfiguration("ada");
  window.showMessage (JSON.stringify(options));

  const serverOptions = {
    command: 'ada_language_server',
  }
  const clientOption : LanguageClientOptions = {
    documentSelector: ['ada']
  }
  const client = new LanguageClient(
    'coc-als',
    'ada_language_server',
    serverOptions,
    clientOption
  )
  // window.showMessage(`coc-als works!`);
  // function otherFileHandler() {
      // const activeEditor = window.;
      // if (!activeEditor) {
          // return;
      // }
      // void client.sendRequest(languageclient.ExecuteCommandRequest.type, {
          // command: 'als-other-file',
          // arguments: [
              // {
                  // uri: window.document.uri.toString(),
              // },
          // ],
      // });
  // }

  context.subscriptions.push(services.registLanguageClient(client))
  context.subscriptions.push(
    commands.registerCommand('ada.otherFile', async () => {
      let document = await workspace.document;
      let file = document.uri

      window.showMessage(`coc-als Commands works! ${file}`);
      workspace.loadFile(`${file}.tmp`);
    }),

    // listManager.registerList(new DemoList(workspace.nvim)),

    // sources.createSource({
      // name: 'coc-als completion source', // unique id
      // doComplete: async () => {
        // const items = await getCompletionItems();
        // return items;
      // },
    // }),

    // workspace.registerKeymap(
      // ['n'],
      // 'als-keymap',
      // async () => {
        // window.showMessage(`registerKeymap`);
      // },
      // { sync: false }
    // ),

    // workspace.registerAutocmd({
      // event: 'InsertLeave',
      // request: true,
      // callback: () => {
        // window.showMessage(`registerAutocmd on InsertLeave`);
      // },
    // })
  );
}


