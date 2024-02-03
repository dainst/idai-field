import { Resource } from '../model/resource';
import { Constraint } from '../model/constraint';
import { Query } from '../model/query';
import { ConstraintIndex } from './constraint-index';
import { FulltextIndex } from './fulltext-index';
import { ResultSets } from './result-sets';


/**
 * @author Daniel de Oliveira
 *
 * Runtime info: Skips the fulltime query if query is empty and constraint search delivered results
 */
export function performQuery(query: Query,
                             constraintIndex: ConstraintIndex,
                             fulltextIndex: FulltextIndex,
                             logic: 'AND' | 'OR' = 'OR'): Array<Resource.Id> {

    let resultSets = performConstraints(
        constraintIndex,
        query.constraints ? query.constraints : {},
        logic
    );

    resultSets = ResultSets.containsOnlyEmptyAddSets(resultSets)
        || (Query.isEmpty(query) && !ResultSets.isEmpty(resultSets))
            ? resultSets
            : performFulltext(fulltextIndex, query, resultSets);

    return ResultSets.collapse(resultSets);
}


function performFulltext(fulltextIndex: FulltextIndex,
                         query: Query,
                         resultSets: ResultSets<Resource.Id>): ResultSets<Resource.Id> {

    const q = !query.q || query.q.trim() === '' ? '*' : query.q;

    const queryResult = FulltextIndex.get(fulltextIndex, q, query.categories);
    ResultSets.combine(resultSets, queryResult);
    return resultSets;
}

//This seems to be the place where the query is actually performed upon the pouchdb.TOMORROW

function performConstraints(constraintIndex: ConstraintIndex,
                            constraints: { [name: string]: Constraint|string|string[] },
                            logic: 'AND' | 'OR' = 'OR'): ResultSets<Resource.Id> {
    let resultSets = ResultSets.make<Resource.Id>();
    if (logic === 'OR') {

        let orSets: Array<Array<Resource.Id>> = [];
        for (let name in constraints) {
            const { subtract, value, searchRecursively } = Constraint.convert(constraints[name]);
            const get = !searchRecursively ? ConstraintIndex.get : ConstraintIndex.getWithDescendants;
            const indexItemIds = get(constraintIndex, name, value);
            orSets.push(indexItemIds);
        }
        resultSets.addSets.push(ResultSets.unionSets(orSets));
    } else {
        // Existing AND logic
        Object.keys(constraints).forEach(name => {
            const { subtract, value, searchRecursively } = Constraint.convert(constraints[name]);
            const get = !searchRecursively ? ConstraintIndex.get : ConstraintIndex.getWithDescendants;
            const indexItemIds = get(constraintIndex, name, value);

            ResultSets.combine(resultSets, indexItemIds, subtract);
        });
    }

    return resultSets;
}
