import { same, sameset } from 'tsfun';
import { ObjectUtils } from './object-utils';


// TODO review; tests; maybe test getDifferingFields instead
export function compare(value1: any, value2: any): boolean {

    if (value1 === undefined && value2 === undefined) return true;
    if ((value1 && !value2) || (!value1 && value2)) return false;

    const type1: string = getType(value1);
    const type2: string = getType(value2);

    if (type1 !== type2) return false;

    if (type1 === 'array' && type2 === 'array') {
        return sameset(ObjectUtils.jsonEqual, value1, value2)
    }

    return ObjectUtils.jsonEqual(value1)(value2);
}


export const notCompareInBoth = (l: any, r: any) => (key: string) => !compare((l)[key], (r)[key]);


export const notBothEqual = (l: any, r: any) => (key: string) => !r[key] || !same(l[key], r[key]);


function getType(value: any): string {

    return typeof value === 'object'
        ? value instanceof Array
            ? 'array'
            : 'object'
        : 'flat';
}
