import {equal, is, isNot, on, Pair, to, sort, count, flow, val, map, tuplify,
    compose, separate, undefinedOrEmpty, size, isUndefinedOrEmpty, cond} from 'tsfun';
import {Query} from 'idai-components-2';
import {IndexItem, TypeResourceIndexItem} from './index-item';
import {SortUtil} from '../../util/sort-util';
import {Name, ResourceId} from '../../constants';
import {doPaired} from '../../util/utils';


// @author Daniel de Oliveira
// @author Thomas Kleinke


const ID = 'id';
const IDENTIFIER = 'identifier';
const INSTANCES = 'instances';
const TYPE = 'Type';

type Percentage = number;


/**
 * If not specified otherwise, indexItems get sorted
 * alphanumerically by their identifier property.
 *
 * @param indexItems
 * @param query
 *   - if query.types === ['Type'],
 *     query.rankOptions[MATCH_TYPE] can be set
 *   . in order to perform a ranking of Type resources then.
 *     if query.rankOptions[MATCH_TYPE] is not set, a regular
 *     sort gets performed instead.
 *   - if query.sort === 'exactMatchFirst', then, after sorting,
 *     puts an element which matches the query exactly, to the
 *     front of the resulting list.
 */
export function getSortedIds(indexItems: Array<IndexItem>,
                             query: Query): Array<ResourceId> {

    const rankEntries = shouldRankTypes(query)
        ? rankTypeResourceIndexItems((query.sort as any).matchType)
        : rankRegularIndexItems;

    const handleExactMatchIfQuerySaysSo =
        cond(
            val(shouldHandleExactMatch(query)),
            handleExactMatch(query.q as string));

    return flow(
        indexItems,
        rankEntries,
        handleExactMatchIfQuerySaysSo,
        map(to(ID)));
}


function shouldHandleExactMatch(query: Query) {

    return query.sort?.mode === 'exactMatchFirst' && isNot(undefinedOrEmpty)(query.q)
}


function shouldRankTypes(query: Query) {

    return equal(query.types)([TYPE]) && query.sort?.matchType;
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


/**
 * { id: '1', instances: { '2', 'T1', '3': 'T2' }}
 * typeToMatch = 'T1'
 * ->
 * 50
 */
const calcPercentage = (typeToMatch: Name)
    : (indexItem: TypeResourceIndexItem) => number =>
    compose(
        to(INSTANCES),
        cond(isUndefinedOrEmpty,
            val(0),
            compose(
                tuplify(count(is(typeToMatch)), size),
                ([numMatching, numTotal]: any) => numMatching * 100 / numTotal)));


/**
 * [{identifier: 'a'}, {identifier: 'b'}, {identifier: 'c'}]
 * q = 'b'
 * ->
 * [{identifier: 'b'}, {identifier: 'a'}, {identifier: 'c'}]
 */
const handleExactMatch = (q: string)
    : (indexItems: Array<IndexItem>) => Array<IndexItem> =>
     compose(
        separate(on(IDENTIFIER, is(q))),
        ([match, nonMatch]: any) => match.concat(nonMatch));


const rankRegularIndexItems
    : (indexItems: Array<IndexItem>) => Array<IndexItem> =
    sort((a: IndexItem, b: IndexItem) =>
        SortUtil.alnumCompare(a.identifier, b.identifier));


/**
 * [{id: '3', instances: {'7': 'T2'}}
 *  {id: '2', instances: {'4': 'T1', '6': 'T2'}}
 *  {id: '1', instances: {'4': 'T1', '5': 'T1'}}
 *  {id: '0', instances: {'4': 'T1', '5': 'T1', '8': 'T1'}}]
 * typeToMatch = 'T1'
 * ->
 * [{id: '0', instances: {'4': 'T1', '5': 'T1', '8': 'T1'}} // 100%, 3 matches
 *  {id: '1', instances: {'4': 'T1', '5': 'T1'}}            // 100%, 2 matches
 *  {id: '2', instances: {'4': 'T1', '6': 'T2'}}            // 50%
 *  {id: '3', instances: {'7': 'T2'}}]                      // 0%
 */
const rankTypeResourceIndexItems = (typeToMatch: Name)
    : (indexItems: Array<IndexItem>) => Array<IndexItem> =>
    doPaired(
        calcPercentage(typeToMatch),
        sort(comparePercentages));