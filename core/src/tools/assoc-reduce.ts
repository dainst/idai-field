import {copy, keysValues, Map} from 'tsfun';


/**
 * source: ['c','d']
 * target: {}
 * f: a => [a, a + a]
 * ->
 * { c: 'cc', d: 'dd'}
 */
export function assocReduce<T,A>(f: (a: A, i?: number|string) => [number, T], target: Array<T>)
    : (source: Array<A>|Map<A>) => Array<T>;
export function assocReduce<T,A>(f: (a: A, i?: number|string) => [string, T], target: Map<T>)
    : (source: Array<A>|Map<A>) => Map<T>;
export function assocReduce<T,A>(f: (a: A, i?: number|string) => [string|number, T], target: Map<T>|Array<T>) {

    return (source: Array<A>|Map<A>) => keysValues(/* we do not modify target in place */
        copy(source as any))
        .reduce((copied: any, [i,a]: any) => {
            const [k1, v1] = f(a, i);
            copied[k1] = v1;
            return copied;
        }, target);
}
