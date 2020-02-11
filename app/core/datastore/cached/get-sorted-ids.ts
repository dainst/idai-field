import {equal, is, isNot, on, Pair, to, sort, count, prepend, copy, flow, remove, val, map,
    compose, separate, undefinedOrEmpty, size, isUndefinedOrEmpty, cond} from 'tsfun';
import {Query} from 'idai-components-2';
import {IndexItem, TypeName, TypeResourceIndexItem} from '../index/index-item';
import {SortUtil} from '../../util/sort-util';
import {Name, ResourceId} from '../../constants';
import {doPaired} from '../../util/utils';


// @author Daniel de Oliveira
// @author Thomas Kleinke


const ID = 'id';
const IDENTIFIER = 'identifier';
const INSTANCES = 'instances';
const MATCH_TYPE = 'matchType';

type Percentage = number;


/**
 * @param indexItems
 * @param query
 */
export function getSortedIds(indexItems: Array<IndexItem>,
                             query: Query): Array<ResourceId> {

    const rankEntries = (shouldRankTypes(query)
        ? handleTypesForName(query.rankOptions[MATCH_TYPE])
        : generateOrderedResultList);

    const handleExactMatchIfQuerySaysSo =
        cond(
            val(shouldHandleExactMatch(query)),
            handleExactMatch(query.q as string /* TODO review typing */));

    return flow(
        indexItems,
        rankEntries,
        handleExactMatchIfQuerySaysSo,
        map(to(ID)));
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


const calcPercentage = (typeToMatch: Name)
    : (indexItem: TypeResourceIndexItem) => number =>
    compose(
        to(INSTANCES),
        cond(isUndefinedOrEmpty,
            val(0),
            (instances: { [resourceId: string]: TypeName }) =>
                count(is(typeToMatch))(instances) * 100 / size(instances)));


const handleExactMatch = (q: string)
    : (indexItems: Array<IndexItem>) => Array<IndexItem> =>
     compose(
        separate(on(IDENTIFIER, is(q))),
        ([match, nonMatch]: any) => match.concat(nonMatch));



const generateOrderedResultList
    : (indexItems: Array<IndexItem>) => Array<IndexItem> =
    sort((a: IndexItem, b: IndexItem) =>
        SortUtil.alnumCompare(a.identifier, b.identifier));


/**
 * For indexItems it calculates percentages based on how many
 * instances match the given type, and sorts according to the calculated percentages.
 */
const handleTypesForName = (typeToMatch: Name)
    : (indexItems: Array<IndexItem>) => Array<IndexItem> =>
    doPaired(
        calcPercentage(typeToMatch),
        sort(comparePercentages));