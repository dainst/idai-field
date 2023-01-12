import { equal, same } from 'tsfun';


export function compare(value1: any, value2: any): boolean {

    if (value1 === undefined && value2 === undefined) return true;
    if ((value1 && !value2) || (!value1 && value2)) return false;
    if (typeof(value1) !== typeof(value2)) return false;

    return equal(value1)(value2);
}


export const notCompareInBoth = (l: any, r: any) => (key: string) => !compare((l)[key], (r)[key]);


export const notBothEqual = (l: any, r: any) => (key: string) => !r[key] || !same(l[key], r[key]);
