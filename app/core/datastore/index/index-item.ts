import {Action, Document} from 'idai-components-2';

export type TypeName = string;

export interface IndexItem {

    id: string;
    date: Date,
    identifier: string
}


export interface TypeResourceIndexItem extends IndexItem {

    instances: { [resourceId: string]: TypeName}
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IndexItem {

    private constructor() {} // hide on purpose, use from or copy instead


    public static from(document: Document, showWarnings: boolean = false): IndexItem|undefined {

        if (!document.resource) {
            if (showWarnings) console.warn('no resource, will not index');
            return undefined;
        }
        if (!document.resource.id) {
            if (showWarnings) console.warn('no resourceId, will not index');
            return undefined;
        }
        if (!document.resource.identifier) {
            if (showWarnings) console.warn('no identifier, will not index');
            return undefined;
        }
        const lastModified: Action = Document.getLastModified(document);
        if (!lastModified) {
            if (showWarnings) console.warn('no created/modified action, will not index', document);
            return undefined;
        }

        return {
            id: document.resource.id,
            date: lastModified.date as Date,
            identifier: document.resource.identifier
        };
    }
}
