import {equal, is, isNot, on, Pair, to,
    undefinedOrEmpty, size, isUndefinedOrEmpty} from 'tsfun';
import {Query} from 'idai-components-2';
import {IndexItem, TypeResourceIndexItem} from '../index/index-item';
import {SortUtil} from '../../util/sort-util';
import {Name, ResourceId} from '../../constants';
import {count, doPaired, sort} from '../../util/utils';


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

    indexItems =
        (shouldRankTypes(query)
            ? handleTypesForName(query.rankOptions[MATCH_TYPE])
            : generateOrderedResultList)
        (indexItems);

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
                          query: Query) { // TODO return copy

    const exactMatch = indexItems.find(on(IDENTIFIER, is(query.q)));

    if (exactMatch) {
        indexItems.splice(indexItems.indexOf(exactMatch), 1);
        indexItems.unshift(exactMatch);
    }
}


/**
 * Produces function which takes Array<IndexItem>
 */
const generateOrderedResultList =
    sort((a: IndexItem, b: IndexItem) =>
        SortUtil.alnumCompare(a.identifier, b.identifier));


/**
 * Produces function which takes an Array<ResourceTypeIndexItem>.
 *
 * For the elements it calculates percentages based on how many
 * instances match the given type, and sorts according to the calculated percentages.
 */
const handleTypesForName = (typeToMatch: Name) =>
    doPaired(
        calcPercentage(typeToMatch),
        sort(comparePercentages));