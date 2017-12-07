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

    public static from(document: Document): IndexItem|undefined {

        if (!document.resource['identifier']) {
            console.warn("no identifier, will not index");
            return undefined;
        }
        const lastModified: Action = ChangeHistoryUtil.getLastModified(document);
        if (!lastModified) {
            console.warn('Failed to index document. ' +
                'The document does not contain a created/modified action.', document);
            return undefined;
        }

        return {
            date: lastModified.date,
            identifier: document.resource['identifier']
        } as IndexItem;
    }
}
