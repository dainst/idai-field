import {ObjectCollection, reduce, dissoc, getOn, isObject, isArray, values, isEmpty, is, } from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export const makeLookup = (path: string) => {

    return <A>(as: Array<A>): ObjectCollection<A> => {

        return reduce((amap: {[_:string]: A}, a: A) => {

            amap[getOn(path)(a)] = a;
            return amap;

        }, {})(as);
    }
};


/**
 * @param struct
 * @author Daniel de Oliveira
 */
export function hasEmptyAssociatives(struct: any): boolean {

    if (!isArray(struct) && !isObject(struct)) return false;
    if (isEmpty(struct)) return true;
    return values(struct)
        .map(hasEmptyAssociatives)
        .some(is(true));
}


export function withDissoc(struct: any, path: string) {

   return dissoc(path)(struct);
}


export function startsWith(with_: string) { return (what: string) => what.startsWith(with_)}

export function longerThan(than: string) { return (what: string) => what.length > than.length }

export function includes(it: string) { return (what: string) => what.includes(it) }

export function isEmptyString(a: any) { return typeof a === 'string' && a === '' }

export function isAssociative(a: any) { return isObject(a) || isArray(a) }