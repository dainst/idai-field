import {isNot, sameAs, bigger, smaller, includedIn, differentFrom, times} from './list-util-base';
export {isNot, sameAs, bigger, smaller, includedIn, differentFrom, times};
import {takeRightWhile, dropWhile, takeUntil, takeWhile} from './list-util-drop-take';
export {takeRightWhile, dropWhile, takeUntil, takeWhile};
import {flow, reverse, map, filter} from './list-util-flow';
export {flow, reverse, map, filter};
import {getAtIndex, getAtIndexOr, removeAtIndex} from './list-util-index';
export {getAtIndex, getAtIndexOr, removeAtIndex};
import {NestedArray, intersection, union, intersect, subtract, unite} from './list-util-sets';
export {NestedArray, intersection, union, intersect, subtract, unite};


/**
 * @author Daniel de Oliveira
 */


export const removeFrom = <A>(as: Array<A>) => (a: A): Array<A> =>
    subtract([a])(as);


export const addUniqueTo = <A>(as: Array<A>) => (a: A): Array<A> =>
    as.includes(a) ? as : as.concat([a]);




