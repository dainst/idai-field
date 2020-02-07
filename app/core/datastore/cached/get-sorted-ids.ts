import {IndexItem, SimpleIndexItem} from '../index/index-item';
import {Query} from 'idai-components-2';

// @author Daniel de Oliveira
// @author Thomas Kleinke


/**
 * @param indexItems // TODO review typing: must be Array<IndexItem> if exactMatchFirst
 * @param query
 */
export function getSortedIds(indexItems: Array<SimpleIndexItem>, query: Query): string[] {

    indexItems = IndexItem.generateOrderedResultList(indexItems); // TODO move to this file

    if (query.sort === 'exactMatchFirst' && query.q && query.q.length > 0) {

        const exactMatch: SimpleIndexItem | undefined
            = indexItems.find((indexItem: any) => indexItem['identifier'] === query.q);

        if (exactMatch) {
            indexItems.splice(indexItems.indexOf(exactMatch), 1);
            indexItems.unshift(exactMatch);
        }
    }

    return indexItems.map(indexItem => indexItem.id);
}