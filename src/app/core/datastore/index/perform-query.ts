import {keys, flatMap} from 'tsfun';
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
        query.constraints ? query.constraints : {},
        indexItemsMap);

    resultSets = ResultSets.containsOnlyEmptyAddSets(resultSets)
        || (Query.isEmpty(query) && !ResultSets.isEmpty(resultSets))
            ? resultSets
            : performFulltext(fulltextIndex, query, resultSets);

    return ResultSets.collapse(resultSets);
}


function performFulltext(fulltextIndex: FulltextIndex,
                         query: Query,
                         resultSets: ResultSets)
    : ResultSets {

    const q = !query.q || query.q.trim() === '' ? '*' : query.q;
    ResultSets.combine(resultSets, FulltextIndex.get(fulltextIndex, q, query.categories));

    return resultSets;
}


function performConstraints(constraintIndex: ConstraintIndex,
                            constraints: { [name: string]: Constraint|string|string[] },
                            indexItemsMap: { [resourceId: string]: IndexItem })
    : ResultSets {

    return keys(constraints)
        .reduce((resultSets, name: string) => {

            const { subtract, value, searchRecursively } = Constraint.convert(constraints[name]);

            const get = !searchRecursively
                ? ConstraintIndex.get
                : ConstraintIndex.getWithDescendants;

            const indexItemIds = get(constraintIndex, name, value);
            // TODO review if deduplication necessary here
            const indexItems = flatMap(lookup(indexItemsMap) as any /* TODO review as any */)(indexItemIds) as any /* TODO review as any */;

            ResultSets.combine(resultSets, indexItems as any /* TODO review */, subtract);
            return resultSets;
        }, ResultSets.make());
}
