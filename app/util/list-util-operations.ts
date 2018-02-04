import {includedIn, isNot} from './list-util-base';


export const removeFrom = <A>(as: Array<A>) => (a: A): Array<A> =>
    subtractFrom(as)([a]);


export const addUniqueTo = <A>(as: Array<A>) => (a: A): Array<A> =>
    as.includes(a) ? as : as.concat([a]);


export const intersectWith = <A>(a1: Array<A>) =>
    (a2: Array<A>) => a1.filter(includedIn(a2));


/**
 * Generate a new list with elements which are contained in l but not in subtrahend
 */
export const subtractFrom = <A>(as: Array<A>) =>
    (subtrahend: Array<A>): Array<A> =>
        as.filter(isNot(includedIn(subtrahend)));


/**
 * @returns the union of a1 and a2
 */
export const uniteWith = <A>(a1: Array<A>) =>
    (a2: Array<A>) =>
        a1.concat(
            a2.filter(isNot(includedIn(a1))));