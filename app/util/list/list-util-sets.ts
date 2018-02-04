import {includedIn, isNot, uncurry2} from './list-util-base';


export type NestedArray<A> = Array<Array<A>>;


export const intersection = <A>(aas: NestedArray<A>): Array<A> =>
    aas.length < 1 ? [] :
        aas.reduce(uncurry2<A>(intersect));


export const union = <A>(aas: NestedArray<A>): Array<A> =>
    aas.length < 1 ? [] :
        aas.reduce((acc, val) => val ? unite(acc)(val) : acc);


export const intersect = <A>(as1: Array<A>) =>
    (as2: Array<A>) => as1.filter(includedIn(as2));


/**
 * Generate a new list with elements which are contained in l but not in subtrahend
 */
export const subtract = <A>(subtrahend: Array<A>) =>
    (as: Array<A>): Array<A> =>
        as.filter(isNot(includedIn(subtrahend)));


/**
 * @returns the union of a1 and a2
 */
export const unite = <A>(as1: Array<A>) =>
    (as2: Array<A>) =>
        as1.concat(
            as2.filter(isNot(includedIn(as1))));