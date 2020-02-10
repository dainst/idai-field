import {equal, is, isNot, on, Pair, to, sort, count, prepend, copy, flow, remove,
    undefinedOrEmpty, size, isUndefinedOrEmpty} from 'tsfun';
import {Query} from 'idai-components-2';
import {IndexItem, TypeResourceIndexItem} from '../index/index-item';
import {SortUtil} from '../../util/sort-util';
import {Name, ResourceId} from '../../constants';
import {doPaired} from '../../util/utils';


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

    let sortedItems =
        (shouldRankTypes(query)
            ? handleTypesForName(query.rankOptions[MATCH_TYPE])
            : generateOrderedResultList)
        (indexItems);

    if (shouldHandleExactMatch(query)) {
        sortedItems = handleExactMatch(sortedItems, query.q as string /* TODO review typing */);
    }
    return sortedItems.map(to(ID));
}


function shouldHandleExactMatch(query: Query) {

    return query.sort === 'exactMatchFirst' && isNot(undefinedOrEmpty)(query.q)
}


function shouldRankTypes(query: Query) {

    return equal(query.types)(['Type'])
        && query.rankOptions
        && query.rankOptions[MATCH_TYPE];
}


function comparePercentages([itemA, pctgA]: Pair<TypeResourceIndexItem, Percentage>,
                            [itemB, pctgB]: Pair<TypeResourceIndexItem, Percentage>) {

    if (pctgA < pctgB) return 1;
    if (pctgA === pctgB) {
        return size(itemA.instances) < size(itemB.instances)
            ? 1
            : -1;
    }
    return -1;
}


function calcPercentage(rankTypesFor: Name) {

    return (indexItem: TypeResourceIndexItem) => {

        const instances = indexItem.instances;
        if (isUndefinedOrEmpty(instances)) return 0;
        return count(is(rankTypesFor))(instances) * 100 / size(instances);
    };
}


function handleExactMatch(indexItems: Array<IndexItem>,
                          q: string): Array<IndexItem> {

    const exactMatch: IndexItem|undefined = indexItems.find(on(IDENTIFIER, is(q)));

    return exactMatch !== undefined
        ? flow(
            indexItems,
            remove(on(IDENTIFIER, is(q))),
            prepend(exactMatch))
        : copy(indexItems);
}


const generateOrderedResultList:
    (indexItems: Array<IndexItem>) => Array<IndexItem> =
    sort((a: IndexItem, b: IndexItem) =>
        SortUtil.alnumCompare(a.identifier, b.identifier));


/**
 * For indexItems it calculates percentages based on how many
 * instances match the given type, and sorts according to the calculated percentages.
 */
const handleTypesForName =
    (typeToMatch: Name): (indexItems: Array<IndexItem>) => Array<IndexItem> =>
    doPaired(
        calcPercentage(typeToMatch),
        sort(comparePercentages));