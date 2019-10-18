import {append, compose, dropRight, flow, takeRight, to, take, drop, cond, len, is, val} from 'tsfun';


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


const lengthIs2 = compose(len, is(2));

/**
 * Gets the penultimate of an Array of A's, if it exists.
 * @returns A|undefined
 */
export const penultimate = compose(
    takeRight(2),
    cond(
        lengthIs2,
        to('[0]'),
        val(undefined)));


export const ultimate = last;


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