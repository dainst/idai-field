import {on, is, isNot, undefinedOrEmpty, to, keys, filter, equal} from 'tsfun';
import {Query} from 'idai-components-2';
import {IndexItem, SimpleIndexItem} from '../index/index-item';
import {SortUtil} from '../../util/sort-util';
import {Name, ResourceId} from '../../constants';
import {isUndefinedOrEmpty} from 'tsfun/src/predicate';

// @author Daniel de Oliveira
// @author Thomas Kleinke


/**
 * @param indexItems // TODO review typing: must be Array<IndexItem> if exactMatchFirst
 * @param query
 */
export function getSortedIds(indexItems: Array<SimpleIndexItem>,
                             query: Query): Array<ResourceId> {

    indexItems = generateOrderedResultList(indexItems);
    if (equal(query.types)(['Type']) && query.rankOptions && query.rankOptions['matchType']) {
        handleTypesForName(indexItems, query, query.rankOptions['matchType']);
    }
    handleExactMatch(indexItems, query);
    return indexItems.map(to('id'));
}


function handleTypesForName(indexItems: Array<SimpleIndexItem>,
                            query: Query,
                            rankTypesFor: Name) {

    indexItems.map(indexItem => {

        if (isUndefinedOrEmpty(keys((indexItem as any)['instances']))) return indexItem;

        (indexItem as any)['matchPercentage'] = keys(filter(is(rankTypesFor))((indexItem as any)['instances'])).length
            * 100.0 / keys((indexItem as any)['instances']).length;
        return indexItem;
    });

    indexItems.sort((a: any, b: any) => {

        if (a['matchPercentage'] < b['matchPercentage']) return 1;
        if (a['matchPercentage'] === b['matchPercentage']) return 0;
        return -1;
    });
}


function handleExactMatch(indexItems: Array<SimpleIndexItem>,
                          query: Query) {

    if (query.sort === 'exactMatchFirst' && isNot(undefinedOrEmpty)(query.q)) {

        const exactMatch = indexItems.find(on('identifier', is(query.q)));

        if (exactMatch) {
            indexItems.splice(indexItems.indexOf(exactMatch), 1);
            indexItems.unshift(exactMatch);
        }
    }
}


function generateOrderedResultList(items: Array<SimpleIndexItem>): Array<SimpleIndexItem> {

    return items
        .sort((a: any, b: any) =>
            // we know that an IndexItem created with from has the identifier field
            SortUtil.alnumCompare(a['identifier'], b['identifier']));
}