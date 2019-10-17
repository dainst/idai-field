import {append, compose, dropRight, flow, takeRight, to, take, drop} from 'tsfun';

export const STAFF = 'staff';


export const CAMPAIGNS = 'campaigns';


export function replaceLast<A>(replacement: A){ return (as: Array<A>): Array<A> => {

    return replaceRight(as, 1, replacement);
}}


export function replaceLastPair<A>(as: Array<A>, replacement: A): Array<A> {

    return replaceRight(as, 2, replacement);
}


function replaceRight<A>(as: Array<A>, itemsToReplace: number, replacement: A): Array<A> {

    return flow(as, dropRight(itemsToReplace), append([replacement]));
}


export const last = compose(takeRight(1), to('[0]'));


/**
 * Dissociates the given indices from an array.
 *
 * Example
 *   > dissocIndices([0, 2])(['a', 'b', 'c', 'd')
 *   ['b', 'd']
 *
 * @param indices must be sorted in ascending order
 */
export function dissocIndices<A>(indices: number[]) { return (as: Array<A>): Array<A> => {

    const index = last(indices);
    return index === undefined
        ? as
        : dissocIndices
            (dropRight(1)(indices) as number[])
            (take(index)(as).concat(drop(index + 1)(as)) as Array<A>) as Array<A>;
}}