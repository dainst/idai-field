import {intersection, union, subtract, flow, cond, isNot, empty} from 'tsfun';


export interface ResultSets {

    addSets: Array<Array<string>>,
    subtractSets: Array<Array<string>>,
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ResultSets { // TODO after getting rid of IndexItems dependency in FulltextIndex, pull this into perform-query.ts

    export function make(): ResultSets {

        return { addSets: [], subtractSets: [] } ;
    }


    export function isEmpty(resultSets: ResultSets): boolean {

        return resultSets.addSets.length === 0 &&
            resultSets.subtractSets.length === 0;
    }


    export function containsOnlyEmptyAddSets(resultSets: ResultSets): boolean {

        if (resultSets.addSets.length === 0) return false;
        return !resultSets.addSets
            .some(addSet => addSet.length > 0);
    }


    export function combine(resultSets: ResultSets,
                            ids: Array<string>,
                            subtract: undefined|true = undefined): void {

        (!subtract
            ? resultSets.addSets
            : resultSets.subtractSets)
            .push(ids);
    }


    export function collapse(resultSets: ResultSets): Array<string> {

        return flow(
            intersection(resultSets.addSets),
            cond(
                isNot(empty)(resultSets.subtractSets),
                subtract(union(resultSets.subtractSets))));
    }


    export function unify(resultSets: ResultSets): Array<string> {

        return union(resultSets.addSets);
    }
}
