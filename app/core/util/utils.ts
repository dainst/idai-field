import {copy, Pair, reduce, ObjectCollection, to, range, map, val,
    isDefined, convertPath, Predicate, getOn, isArray, isObject} from 'tsfun';

// @author Daniel de Oliveira

export const isBoolean: Predicate<any> = (value: any) => typeof value === 'boolean';

export const isString: Predicate<any> = (as: any) => typeof as === 'string';


export function split(pattern: any) {

    return (content: string) => content.split(pattern);
}


export function toLowerCase(s: string) {

    return s.toLowerCase();
}


export function toArray(token: any) {

    return Array.from(token);
}


export function denseArray(size: number) {

    return map(val(undefined))(range(size));
}


export function throwSomething(e: any) {

    return (): any => { throw e };
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

    if (isArray(target)) {

        return reduce((copied: Array<T>, [index, content]: Pair<number, T>) => {
            copied[index] = content;
            return copied;
        }, copy(target as Array<T>)) as unknown as (source: Pair<number, T>) => Array<T>;

    } else if (isObject(target)) {

        return reduce((copied: ObjectCollection<T>, [key, content]: Pair<string, T>) => {
            copied[key] = content;
            return copied;
        }, copy(target as ObjectCollection<T>)) as unknown as (source: Pair<string, T>) => ObjectCollection<T>;

    } else {
        throw 'illegal argument - must be array or object';
    }
}


/**
 * keys = ['a', 'b']
 * o = { a: 1, b: 2, c: 3 }
 * ->
 * [1, 2]
 */
export function toTuple(...keys: string[]) {

    return <T>(o: ObjectCollection<T>) => keys.map(k => to(k)(o));
}


export const intoObj = <T>(keyName: string, valName: string) =>
    (object: ObjectCollection<T>, item: ObjectCollection<T>) =>
        isDefined(item[keyName])
            ? (object[((item[keyName]) as any).toString()] = item[valName], object)
            : object;


export function setOn(object: any, path: string) {

    return (val: any): void => _setOn(object, convertPath(path), val);
}


/**
 * if o has not already a value at path, it sets it to alternative
 */
export function takeOrMake<T>(o: T, path: string, alternative: any) {

    return setOn(o, path)(getOn(path , alternative)(o));
}


function _setOn(object: any, path: Array<string|number>, val: any) {

    const key = path[0];

    if (path.length === 1) {
        object[key] = val;
    } else {
        path.shift();
        if (!object[key]) {
            object[key] = isString(key)
                ? {}
                : [];
        }
        _setOn(object[key], path, val);
    }
}