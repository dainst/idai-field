import {identity, filter, ObjectCollection, compose,
    isArray, keys, copy, Pair, first, flow, map, pairWith} from 'tsfun';


export function isBoolean(value: any): boolean {

    return typeof value === 'boolean';
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