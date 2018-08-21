import {Action, Document} from 'idai-components-2';
import {SortUtil} from '../../../util/sort-util';


export interface SimpleIndexItem {

    id: string;
}

export interface IndexItem extends SimpleIndexItem {

    date: Date,
    identifier: string
}


/**
 * Companion object
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IndexItem {

    private constructor() {} // hide on purpose, use from or copy instead


    public static from(document: Document, showWarnings: boolean): IndexItem|undefined {

        if (!document.resource) {
            if (showWarnings) console.warn('no resource, will not index');
            return undefined;
        }
        if (!document.resource.id) {
            if (showWarnings) console.warn('no resourceId, will not index');
            return undefined;
        }
        if (!document.resource['identifier']) {
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
            identifier: document.resource['identifier']
        };
    }


    public static generateOrderedResultList(items: Array<SimpleIndexItem>): Array<any> {

        return items
            .sort((a: any, b: any) =>
                // we know that an IndexItem created with from has the identifier field
                SortUtil.alnumCompare(a['identifier'], b['identifier']))
            .map((e: any) => e['id']);
    }
}
