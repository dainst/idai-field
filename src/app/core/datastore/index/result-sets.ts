import {intersection, union, subtract, flow, cond, isNot, empty} from 'tsfun';
import {Resource} from 'idai-components-2';


export interface ResultSets {

    addSets: Array<Array<Resource.Id>>,
    subtractSets: Array<Array<Resource.Id>>,
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ResultSets {

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
                            ids: Array<Resource.Id>,
                            subtract: undefined|true = undefined): void {

        (!subtract
            ? resultSets.addSets
            : resultSets.subtractSets)
            .push(ids);
    }


    export function collapse(resultSets: ResultSets): Array<Resource.Id> {

        return flow(
            intersection(resultSets.addSets),
            cond(
                isNot(empty)(resultSets.subtractSets),
                subtract(union(resultSets.subtractSets))));
    }


    export function unify(resultSets: ResultSets): Array<Resource.Id> { // TODO get rid of this function

        return union(resultSets.addSets);
    }
}
