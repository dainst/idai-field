import {identity, filter, ObjectCollection, isArray, keys} from 'tsfun';


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