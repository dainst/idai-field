import {keys, values, map} from 'tsfun';
import {lookup} from 'tsfun/associative';
import {ConstraintIndex} from './constraint-index';
import {FulltextIndex} from './fulltext-index';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';
import {Query} from '../model/query';
import {Constraint} from '../model/constraint';


/**
 * @author Daniel de Oliveira
 */

/**
 * Runtime info: Skips the fulltime query if query is empty and constraint search delivered results
 */
export function performQuery(query: Query,
                             constraintIndex: ConstraintIndex,
                             fulltextIndex: FulltextIndex,
                             indexItemsMap: { [resourceId: string]: IndexItem })
    : Array<IndexItem> {

    let resultSets = performConstraints(
        constraintIndex,
        query.constraints ? query.constraints : {});

    resultSets = ResultSets.containsOnlyEmptyAddSets(resultSets)
        || (Query.isEmpty(query) && !ResultSets.isEmpty(resultSets))
            ? resultSets
            : performFulltext(fulltextIndex, query, resultSets);

    const result = values(map(lookup(indexItemsMap))(ResultSets.collapse(resultSets)));
    return result;
}


function performFulltext(fulltextIndex: FulltextIndex,
                         query: Query,
                         resultSets: ResultSets)
    : ResultSets {

    const q = !query.q || query.q.trim() === '' ? '*' : query.q;

    const queryResult = FulltextIndex.get(fulltextIndex, q, query.categories);
    ResultSets.combine(resultSets, queryResult);
    return resultSets;
}


function performConstraints(constraintIndex: ConstraintIndex,
                            constraints: { [name: string]: Constraint|string|string[] })
    : ResultSets {

    return keys(constraints)
        .reduce((resultSets, name: string) => {

            const { subtract, value, searchRecursively } = Constraint.convert(constraints[name]);

            const get = !searchRecursively
                ? ConstraintIndex.get
                : ConstraintIndex.getWithDescendants;

            const indexItemIds = get(constraintIndex, name, value);
            // TODO review if deduplication necessary here
            // const indexItems = flatMap(lookup(indexItemsMap) as any /* TODO review as any */)(indexItemIds) as any /* TODO review as any */;
            ResultSets.combine(resultSets, indexItemIds as any /* TODO review */, subtract);
            return resultSets;
        }, ResultSets.make());
}
