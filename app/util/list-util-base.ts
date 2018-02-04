/**
 * @author Daniel de Oliveira
 */

export type NestedArray<A> = Array<Array<A>>;


export const includedIn =  <A>(as: Array<A>) =>
    (a: A) => as.includes(a);


export const times = (l: number) =>
    (r: number) => l * r;


export const differentFrom = <A>(a:A) =>
    isNot(sameAs(a));


export const sameAs = <A>(l:A) =>
    (r:A) => l == r;


export const smaller = <A>(l:A) =>
    (r:A) => l > r;


export const bigger = <A>(l:A) =>
    (r:A) => l < r;


export const isNot = <A>(f: (_: A) => boolean) =>
    (a: A) => flip(f(a));


export const identical = <A>(v: A) => v;


export const flip = (v: boolean) => !v;