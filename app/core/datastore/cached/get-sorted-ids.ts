import {on, is, isNot, undefinedOrEmpty, to, first, keys, filter, equal, values, Pair, copy} from 'tsfun';
import {Query} from 'idai-components-2';
import {IndexItem, TypeResourceIndexItem} from '../index/index-item';
import {SortUtil} from '../../util/sort-util';
import {Name, ResourceId} from '../../constants';
import {isUndefinedOrEmpty} from 'tsfun/src/predicate';
import {pairWith} from '../../util/utils';

// @author Daniel de Oliveira
// @author Thomas Kleinke


const ID = 'id';
const IDENTIFIER = 'identifier';
const MATCH_TYPE = 'matchType';

type Percentage = number;


/**
 * @param indexItems
 * @param query
 */
export function getSortedIds(indexItems: Array<IndexItem>,
                             query: Query): Array<ResourceId> {

    indexItems = shouldRankTypes(query)
        ? handleTypesForName(
            indexItems as Array<TypeResourceIndexItem>,
            query.rankOptions[MATCH_TYPE])
        : generateOrderedResultList(indexItems);

    if (shouldHandleExactMatch(query)) {
        handleExactMatch(indexItems, query);
    }
    return indexItems.map(to(ID));
}


function shouldHandleExactMatch(query: Query) {

    return query.sort === 'exactMatchFirst' && isNot(undefinedOrEmpty)(query.q)
}


function shouldRankTypes(query: Query) {

    return equal(query.types)(['Type'])
        && query.rankOptions
        && query.rankOptions[MATCH_TYPE];
}


function handleTypesForName(indexItems: Array<TypeResourceIndexItem>,
                            rankTypesFor: Name) {

    const pairs = calcPercentages(indexItems, rankTypesFor);
    pairs.sort(comparePercentages);
    return pairs.map(first) as Array<IndexItem>;
}


function comparePercentages(a: Pair<TypeResourceIndexItem, Percentage>,
                            b: Pair<TypeResourceIndexItem, Percentage>) {

    if (a[1] < b[1]) return 1;
    if (a[1] === b[1]) {

        // TODO make count replace keys + length
        if (keys(a[0].instances).length < keys(b[0].instances).length) return 1;
        return -1;
    }
    return -1;
}


function calcPercentages(indexItems: Array<TypeResourceIndexItem>,
                         rankTypesFor: Name): Array<Pair<TypeResourceIndexItem, Percentage>> {

    return indexItems.map(pairWith((indexItem: TypeResourceIndexItem) => {

        const instances = indexItem.instances;
        if (isUndefinedOrEmpty(keys(instances))) return 0;
        return filter(is(rankTypesFor))(values(instances)).length * 100 / keys(instances).length;

    })) as Array<Pair<TypeResourceIndexItem, Percentage>>;
}


function handleExactMatch(indexItems: Array<IndexItem>,
                          query: Query) {

    const exactMatch = indexItems.find(on(IDENTIFIER, is(query.q)));

    if (exactMatch) {
        indexItems.splice(indexItems.indexOf(exactMatch), 1);
        indexItems.unshift(exactMatch);
    }
}


function generateOrderedResultList(items: Array<IndexItem>): Array<IndexItem> {

    return copy(items)
        .sort((a: IndexItem, b: IndexItem) =>
            // we know that an IndexItem created with from has the identifier field
            SortUtil.alnumCompare(a.identifier, b.identifier));
}