// Utils


import {identity} from 'tsfun';


export function isBoolean(value: any): boolean {

    return typeof value === 'boolean';
}


export function tuplify(...fs : any[]) {

    return (s: any) => fs.map(f => f(s));
}


export function pairWith(f: any) {

    return tuplify(identity, f);
}