import {keys} from 'tsfun';
import {Constraint, Query} from 'idai-components-2';
import {ConstraintIndex} from './constraint-index';
import {FulltextIndex} from './fulltext-index';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';


// @author Daniel de Oliveira

/**
 * Runtime info: Skips the fulltime query if query is empty and constraint search delivered results
 *
 * @param query
 * @param constraintIndex
 * @param fulltextIndex
 */
export function performQuery(query: Query,
                             constraintIndex: ConstraintIndex,
                             fulltextIndex: FulltextIndex): Array<IndexItem> {

    let resultSets = performConstraints(constraintIndex, query.constraints ? query.constraints : {});

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
    ResultSets.combine(resultSets, FulltextIndex.get(fulltextIndex, q, query.types));

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

            ResultSets.combine(resultSets, get(constraintIndex, name, value), subtract);
            return resultSets;
        }, ResultSets.make());
}