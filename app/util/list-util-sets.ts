import {includedIn, isNot} from './list-util-base';


export type NestedArray<A> = Array<Array<A>>;


export const intersection = <A>(aas: NestedArray<A>): Array<A> =>
    aas.length < 1 ? [] :
        aas.reduce((acc, val) => intersect(acc)(val));


export const union = <A>(aas: NestedArray<A>): Array<A> =>
    aas.length < 1 ? [] :
        aas.reduce((acc, val) => val ? unite(acc)(val) : acc);


export const intersect = <A>(a1: Array<A>) =>
    (a2: Array<A>) => a1.filter(includedIn(a2));


/**
 * Generate a new list with elements which are contained in l but not in subtrahend
 */
export const subtract = <A>(subtrahend: Array<A>) =>
    (as: Array<A>): Array<A> =>
        as.filter(isNot(includedIn(subtrahend)));


/**
 * @returns the union of a1 and a2
 */
export const unite = <A>(a1: Array<A>) =>
    (a2: Array<A>) =>
        a1.concat(
            a2.filter(isNot(includedIn(a1))));