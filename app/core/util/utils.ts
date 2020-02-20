import {copy, Pair, reduce, ObjectCollection, to} from 'tsfun';

// @author Daniel de Oliveira

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


/**
 * target: { a: 2, b: 3}
 * source: [['a', 17]]
 * ->
 * { a: 17, b: 3}
 */
export function replaceIn<T>(target: ObjectCollection<T>): (source: Pair<string, T>) => ObjectCollection<T>;
export function replaceIn<T>(target: Array<T>): (source: Pair<number, T>) => Array<T>;
export function replaceIn<T>(target: ObjectCollection<T>|Array<T>) {

    return reduce((newRelations: ObjectCollection<T>|Array<T>, [name, content]: Pair<string|number, T>) => {
        (newRelations as any)[name] = content;
        return newRelations;
    }, copy(target as any)/* TODO get rid of any cast */);
}


export function toTuple(...keys: string[]) {

    return <T>(o: ObjectCollection<T>) => keys.map(k => to(k)(o));
}