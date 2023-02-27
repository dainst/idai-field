import { detach, isDefined, Map, Pair } from 'tsfun';


/**
 * @author Daniel de Oliveira
 */

export type Lookup<T> = { [_: string]: T};


export function typeOf(v: any) { return typeof v }


/**
 * to be used with reduce
 */
export function withDissoc(struct: any, path: string) {

    return detach(path)(struct);
}


/**
 * to be used with reduce
 */
export const concatIf = (f: (_: string) => boolean) => (acc: string[], val: string) =>
    f(val) ? acc.concat([val as string]) : acc;


export function toPair<T>(k1: string, k2: string) {

    return (o: Map<T>): Pair<T, T> => [o[k1], o[k2]];
}


export const intoObj = <T>(keyName: string, valName: string) =>
    (object: Map<T>, item: Map<T>) =>
        isDefined(item[keyName])
            ? (object[((item[keyName]) as any).toString()] = item[valName], object)
            : object;


export const base64Encode = (input: string): string => {

    return Buffer.from(input).toString('base64')
}