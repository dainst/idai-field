/**
 * @author Daniel de Oliveira
 */


export const times = (l: number) =>
    (r: number) => l * r;


export const identical = <A>(v: A) => v;


export const includedIn =  <A>(as: Array<A>) =>
    (a: A) => as.includes(a);


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


export const flip = (v: boolean) => !v;


export const uncurry2 = <A>(f: (_: Array<A>) => (_: Array<A>) => Array<A>) =>
    (as1: Array<A>, as2: Array<A>): Array<A> => f(as1)(as2);