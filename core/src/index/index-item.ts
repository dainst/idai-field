import { Document } from '../model/document/document';


export type TypeName = string;

export interface IndexItem {

    id: string;
    identifier: string
}


export interface TypeResourceIndexItem extends IndexItem {

    instances: { [resourceId: string]: TypeName }
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IndexItem {

    private constructor() {} // hide on purpose, use from or copy instead


    public static from(document: Document, showWarnings: boolean = false): IndexItem|undefined {

        if (!document.resource) {
            throw 'illegal argument - document.resource undefined';
        }
        if (!document.resource.id) {
            throw 'illegal argument - document.id undefined';
        }
        if (!document.resource.identifier) {
            if (showWarnings) console.warn('no identifier, will not index');
            return undefined;
        }
        return {
            id: document.resource.id,
            identifier: document.resource.identifier
        };
    }
}
