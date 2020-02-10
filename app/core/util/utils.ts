import {identity, filter, ObjectCollection, compose,
    isArray, keys, copy, Pair, first, flow, map} from 'tsfun';


export function isBoolean(value: any): boolean {

    return typeof value === 'boolean';
}


export function tuplify(...fs : any[]) {

    return (s: any) => fs.map(f => f(s));
}


export function pairWith(f: any) {

    return tuplify(identity, f);
}


export function split(pattern: any) {

    return (content: string) => content.split(pattern);
}


export function toLowerCase(s: string) {

    return s.toLowerCase();
}


export function toArray(token: any) {

    return Array.from(token);
}


export function count<A>(p: Function): { // TODO move to tsfun; type p to Predicate; export Predicate
    (as: Array<A>): number
    (os: ObjectCollection<A>): number
}
export function count<A>(p: Function) {

    return (as: Array<A>|ObjectCollection<A>): number => {

        return isArray(as)
            ? filter(p as any)(as as any).length
            : keys(filter(p as any)(as as any)).length // TODO refactor
    }
}


export function size<A>(as: Array<A>): number; // TODO import from tsfun
export function size<T>(o: ObjectCollection<T>): number;
export function size<T>(o: Array<T>|ObjectCollection<T>): number {

    return (isArray(o)
        ? o.length
        : keys(o).length) as number;
}


export function sort<A>(f: (a: A, b: A) => number) { // TODO refactor; move to tsfun

    return (as: Array<A>): Array<A> => copy(as).sort(f as any);
}


/**
 * Returns a function which takes an array, whose
 * elements get paired by elements produced with pairFunction,
 * and which gets transformed and freed of the tmp
 * elements before returned.
 */
export function doPaired<T, S>(pairFunction: (_: T) => S,
                               transform: (_: Array<Pair<T, S>>) => Array<Pair<T, S>>) {

    return compose(map(pairWith(pairFunction)), transform, map(first));
}