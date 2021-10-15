import { BasicList, commands, LanguageClient, ListAction, ListContext, ListItem, Location, Neovim, RequestType, TextDocumentIdentifier, window, workspace } from 'coc.nvim';
import {DocumentUri} from 'vscode-languageserver-protocol';

export namespace ALS_ShowDependenciesKind {
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

export class DependencyList extends BasicList {
  public readonly name : string;
  public readonly description = 'Load file dependencies from ALS';
  public readonly defaultAction = 'open';
  public actions: ListAction[] = [];
  public client : LanguageClient;
  public load : () => Promise<ListItem[]>;

  constructor(nvim: Neovim, client: LanguageClient, kind: ALS_ShowDependenciesKind.Kind) {
    super(nvim);
    if (kind === ALS_ShowDependenciesKind.Show_Importing)
      this.name = 'importing';
    else
      this.name ='imported';

    this.client = client;
    this.load = this.showDependencies(kind);

    this.addAction('open', (item: ListItem) => {
      workspace.jumpTo(item.data.uri);
    });
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    return await this.load();
  }

  private showDependencies (kind: ALS_ShowDependenciesKind.Kind) {
    return async () => {
      let document = await workspace.document;

      let r = await this.client.sendRequest(requestshowDependencies, {
        textDocument: document.textDocument,
        kind: kind,
        showImplicit: true,
      });

      if (!r) {
        window.showErrorMessage("command failed");
      }

      return r.map<ListItem>(value => {
        return {
          label: value.uri.substring(value.uri.lastIndexOf('/')+1),
          data: {
            uri: value.uri
          }
        };
      });
      }

  }

}
