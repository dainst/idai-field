import {Document, Action} from 'idai-components-2/core';
import {ChangeHistoryUtil} from '../../model/change-history-util';

export interface IndexItem {
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

    private constructor() {} // hide on purpose, use from instead


    public static from(document: Document): IndexItem|undefined {

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
            date: lastModified.date,
            identifier: document.resource['identifier']
        } as IndexItem;
    }
}
