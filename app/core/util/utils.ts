import {identity, filter, ObjectCollection, compose,
    isArray, keys, copy, Pair, first, flow, map} from 'tsfun';


export function isBoolean(value: any): boolean {

    return typeof value === 'boolean';
}


export function tuplify(...fs : any[]) {

    return (s: any) => fs.map(f => f(s));
}


export function pairWith(f: any) { // TODO move to tsfun

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