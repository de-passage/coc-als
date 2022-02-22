import {DocumentUri} from "vscode-languageserver-protocol";

export type AlsReferenceKind = 'write' | 'access' | 'call' | 'dispatching call' | 'parent' | 'child';

export namespace AlsReferenceKind {
   export const Write            : AlsReferenceKind = 'write';
   export const Access           : AlsReferenceKind = 'access';
   export const Static_Call      : AlsReferenceKind = 'call';
   export const Dispatching_Call : AlsReferenceKind = 'dispatching call';
   export const Parent           : AlsReferenceKind = 'parent';
   export const Child            : AlsReferenceKind = 'child';
}

export interface ALSLocation {
	uri: DocumentUri;
	range: Range;
  alsKind?: AlsReferenceKind[];
}
