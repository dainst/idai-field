import {intersectWith, subtractFrom, uniteWith} from './list-util-operations';


/**
 * @author Daniel de Oliveira
 */


export type NestedArray<A> = Array<Array<A>>;


export const subtract = <A>(subtrahends: NestedArray<A>) =>
    (as: Array<A>): Array<A> =>
        subtrahends.reduce(
            (acc, val) => subtractFrom(acc)(val),
            as);


export const intersect = <A>(aas: NestedArray<A>): Array<A> =>
    aas.reduce((acc, val) => intersectWith(acc)(val));


export const unite = <A>(aas: NestedArray<A>): Array<A> =>
    aas.length < 1 ? [] :
        aas.reduce((acc, val) => val ? uniteWith(acc)(val) : acc);