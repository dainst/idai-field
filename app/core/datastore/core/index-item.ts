import {Document, Action} from 'idai-components-2/core';
import {ChangeHistoryUtil} from '../../model/change-history-util';

export interface IndexItem {

    id: string;
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


    public static from(document: Document): IndexItem|undefined {

        if (!document.resource.id) {
            console.warn('no resourceId, will not index');
            return undefined;
        }
        if (!document.resource['identifier']) {
            console.warn("no identifier, will not index");
            return undefined;
        }
        const lastModified: Action = ChangeHistoryUtil.getLastModified(document);
        if (!lastModified) {
            console.warn('no created/modified action, will not index', document);
            return undefined;
        }

        return {
            id: document.resource.id,
            date: lastModified.date as Date,
            identifier: document.resource['identifier']
        };
    }


    public static copy(indexItem: IndexItem): IndexItem {

        return JSON.parse(JSON.stringify(indexItem));
    }
}
