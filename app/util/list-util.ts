import {NestedArray, isNot, sameAs, bigger, smaller, includedIn, differentFrom, times} from './list-util-base';
export {NestedArray, isNot, sameAs, bigger, smaller, includedIn, differentFrom, times};
import {takeRightWhile, dropWhile, takeUntil, takeWhile} from './list-util-drop-take';
export {takeRightWhile, dropWhile, takeUntil, takeWhile};
import {flow, reverse, map, filter} from './list-util-flow';
export {flow, reverse, map, filter};
import {getAtIndex, getAtIndexOr, removeAtIndex} from './list-util-index';
export {getAtIndex, getAtIndexOr, removeAtIndex};

/**
 * @author Daniel de Oliveira
 */

export const subtract = <A>(...subtrahends: Array<Array<A>>) =>
    subtractNested(subtrahends);


export const subtractNested = <A>(subtrahends: NestedArray<A>) =>
    (as: Array<A>): Array<A> =>
        subtrahends.reduce(
            (acc, val) => _subtract(val)(acc),
            as);


export const removeFrom = <A>(as: Array<A>) => (a: A): Array<A> =>
    _subtract([a])(as);


export const addUniqueTo = <A>(as: Array<A>) => (a: A): Array<A> =>
    as.includes(a) ? as : as.concat([a]);


export const intersectWith = <A>(a1: Array<A>) =>
    (a2: Array<A>) => a1.filter(includedIn(a2));


export const intersect = <A>(aas: NestedArray<A>): Array<A> =>
    aas.reduce((acc, val) => intersectWith(acc)(val));


/**
 * @returns the union of a1 and a2
 */
export const uniteWith = <A>(a1: Array<A>) =>
    (a2: Array<A>) =>
        a1.concat(
            a2.filter(isNot(includedIn(a1))));


export const unite = <A>(aas: NestedArray<A>): Array<A> =>
    aas.length < 1 ? [] :
        aas.reduce((acc, val) => val ? uniteWith(acc)(val) : acc);


// private

/**
 * Generate a new list with elements which are contained in l but not in subtrahend
 */
const _subtract = <A>(subtrahend: Array<A>) =>
    (l: Array<A>): Array<A> =>
        l.filter(isNot(includedIn(subtrahend)));