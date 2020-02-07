import {on, is, isNot, undefinedOrEmpty, to} from 'tsfun';
import {Query} from 'idai-components-2';
import {IndexItem, SimpleIndexItem} from '../index/index-item';
import {SortUtil} from '../../util/sort-util';
import {ResourceId} from '../../constants';

// @author Daniel de Oliveira
// @author Thomas Kleinke


/**
 * @param indexItems // TODO review typing: must be Array<IndexItem> if exactMatchFirst
 * @param query
 */
export function getSortedIds(indexItems: Array<SimpleIndexItem>, query: Query): Array<ResourceId> {

    indexItems = generateOrderedResultList(indexItems);

    if (query.sort === 'exactMatchFirst' && isNot(undefinedOrEmpty)(query.q)) {

        const exactMatch = indexItems.find(on('identifier', is(query.q)));

        if (exactMatch) {
            indexItems.splice(indexItems.indexOf(exactMatch), 1);
            indexItems.unshift(exactMatch);
        }
    }

    return indexItems.map(to('id'));
}


function generateOrderedResultList(items: Array<SimpleIndexItem>): Array<SimpleIndexItem> {

    return items
        .sort((a: any, b: any) =>
            // we know that an IndexItem created with from has the identifier field
            SortUtil.alnumCompare(a['identifier'], b['identifier']));
}