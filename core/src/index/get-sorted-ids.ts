import { is, on, Pair, to, sort, count, flow, map, tuplify, flatten, compose, size, isUndefinedOrEmpty,
    separate, cond, pairWith, left, subsetOf } from 'tsfun';
import { Resource } from '../model/document/resource';
import { IndexItem, TypeResourceIndexItem } from './index-item';
import { Query, SortMode } from '../model/datastore/query';
import { Comparator } from '../services/comparator';
import { Name } from '../tools/named';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */


const INSTANCES = 'instances';

type Percentage = number;


/**
 * If not specified otherwise, indexItems get sorted
 * alphanumerically by their identifier property.
 *
 * @param indexItems
 * @param query
 *   - if query.categories includes only type categories,
 *     query.sort.matchType can be set
 *   . in order to perform a ranking of Type resources then.
 *     if query.sort.matchCategory is not set, a regular
 *     sort gets performed instead.
 *   - if query.sort.mode === 'exactMatchFirst', then, after sorting,
 *     puts an element which matches the query exactly, to the
 *     front of the resulting list.
 */
export function getSortedIds(indexItems: Array<IndexItem>, query: Query, typeCategories: string[],
                             comparator: Comparator): Array<Resource.Id> {

    const rankEntries = shouldRankCategories(query, typeCategories)
        ? rankTypeResourceIndexItems(query.sort.matchCategory, comparator)
        : rankRegularIndexItems(query.sort?.mode ?? SortMode.Alphanumeric, comparator);

    const handleExactMatchIfQuerySaysSo = cond(
        shouldHandleExactMatch(query),
        handleExactMatch(query.q)
    );

    return flow(
        indexItems,
        rankEntries,
        handleExactMatchIfQuerySaysSo,
        map(to(Resource.ID)) as any
    );
}


function shouldHandleExactMatch(query: Query) {

    return query.sort?.mode === SortMode.ExactMatchFirst && !isUndefinedOrEmpty(query.q)
}


function shouldRankCategories(query: Query, typeCategories: string[]) {

    return query.sort?.matchCategory && query.categories && subsetOf(typeCategories, query.categories);
}


const comparePercentages = (comparator: Comparator) => ([itemA, pctgA]: Pair<TypeResourceIndexItem, Percentage>,
                            [itemB, pctgB]: Pair<TypeResourceIndexItem, Percentage>) => {

    if (pctgA < pctgB) return 1;
    if (pctgA > pctgB) return -1;

    if (size(itemA.instances) < size(itemB.instances)) return 1;
    if (size(itemA.instances) > size(itemB.instances)) return -1;

    return comparator.alnumCompare(itemA.identifier, itemB.identifier);
}


/**
 * { id: '1', instances: { '2', 'T1', '3': 'T2' }}
 * categoryToMatch = 'T1'
 * ->
 * 50
 */
const calcPercentage = (categoryToMatch: Name): (indexItem: TypeResourceIndexItem) => number =>
    compose(
        to(INSTANCES),
        cond(isUndefinedOrEmpty,
            0,
            compose(
                tuplify(count(is(categoryToMatch)), size),
                ([numMatching, numTotal]: any) => numMatching * 100 / numTotal
            )
        )
    );


/**
 * [{identifier: 'a'}, {identifier: 'b'}, {identifier: 'c'}]
 * q = 'b'
 * ->
 * [{identifier: 'b'}, {identifier: 'a'}, {identifier: 'c'}]
 */
const handleExactMatch = (q: string)
    : (indexItems: Array<IndexItem>) => Array<IndexItem> =>
     compose(
        separate(on(Resource.IDENTIFIER, is(q))),
        flatten() as any);


const rankRegularIndexItems = (sortMode: SortMode, comparator: Comparator): (indexItems: Array<IndexItem>) =>
        Array<IndexItem> =>
    sort((a: IndexItem, b: IndexItem) => {
        switch (sortMode) {
            case SortMode.Alphanumeric:
                return comparator.alnumCompare(a.identifier, b.identifier);
            case SortMode.AlphanumericDescending:
                return comparator.alnumCompare(a.identifier, b.identifier) * -1;
            case SortMode.Date:
                return rankIndexItemsByDateAndIdentifier(a, b, false, comparator);
            case SortMode.DateDescending:
                return rankIndexItemsByDateAndIdentifier(a, b, true, comparator);
        }
    });


function rankIndexItemsByDateAndIdentifier(a: IndexItem, b: IndexItem, descending: boolean,
                                           comparator: Comparator): number {

    const result: number = comparator.numberCompare(a.date, b.date);

    return result !== 0
        ? result * (descending ? -1 : 1)
        : comparator.alnumCompare(a.identifier, b.identifier);
}


/**
 * [{id: '3', instances: {'7': 'T2'}}
 *  {id: '2', instances: {'4': 'T1', '6': 'T2'}}
 *  {id: '1', instances: {'4': 'T1', '5': 'T1'}}
 *  {id: '0', instances: {'4': 'T1', '5': 'T1', '8': 'T1'}}]
 * categoryToMatch = 'T1'
 * ->
 * [{id: '0', instances: {'4': 'T1', '5': 'T1', '8': 'T1'}} // 100%, 3 matches
 *  {id: '1', instances: {'4': 'T1', '5': 'T1'}}            // 100%, 2 matches
 *  {id: '2', instances: {'4': 'T1', '6': 'T2'}}            // 50%
 *  {id: '3', instances: {'7': 'T2'}}]                      // 0%
 */
const rankTypeResourceIndexItems = (categoryToMatch: Name, comparator: Comparator): (indexItems: Array<IndexItem>) =>
        Array<IndexItem> => 
    compose(
        map(pairWith(calcPercentage(categoryToMatch))),
        sort(comparePercentages(comparator)) as any,
        map(left) as any
    );
