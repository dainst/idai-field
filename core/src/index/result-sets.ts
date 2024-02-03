import {intersection, union, subtract, flow, cond} from 'tsfun';
import * as tsfun from 'tsfun';


export interface ResultSets<T> {

    addSets: Array<Array<T>>,
    subtractSets: Array<Array<T>>,
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ResultSets {

    export function make<T>(): ResultSets<T> {

        return { addSets: [], subtractSets: [] } as ResultSets<T>;
    }


    export function isEmpty<T>(resultSets: ResultSets<T>): boolean {

        return resultSets.addSets.length === 0 &&
            resultSets.subtractSets.length === 0;
    }


    export function containsOnlyEmptyAddSets<T>(resultSets: ResultSets<T>): boolean {

        if (resultSets.addSets.length === 0) return false;
        return !resultSets.addSets
            .some(addSet => addSet.length > 0);
    }


    export function combine<T>(resultSets: ResultSets<T>,
                               items: Array<T>,
                               subtract: undefined|true = undefined): void {

        (!subtract
            ? resultSets.addSets
            : resultSets.subtractSets)
            .push(items);
    }


    export function collapse<T>(resultSets: ResultSets<T>): Array<T> {

        return flow(
            intersection(resultSets.addSets),
            cond(
                !tsfun.isEmpty(resultSets.subtractSets),
                subtract(union(resultSets.subtractSets))));
    }


    export function unifyAddSets<T>(resultSets: ResultSets<T>): Array<T> {

        return union(resultSets.addSets);
    }

    export function unionSets<T>(resultSets: Array<Array<T>>): Array<T> {
        return tsfun.union(resultSets);
    }
}
