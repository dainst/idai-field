/**
 * @author Daniel de Oliveira
 */

export type NestedArray<T> = Array<Array<T>>;


export const getAtIndex = <A>(as: Array<A>, i: number): A|undefined => getAtIndexOr(as, i);


export const getAtIndexOr = <A>(as: Array<A>, i: number, defaultValue: A|undefined = undefined): A|undefined =>
    as.length < i ? defaultValue : as[i];


export const removeAtIndex = <A>(as: Array<A>) => (i: number) => as.splice(i, 1);

/**
 * Generate a new list with elements which are contained in l but not in r
 */
export const subtract = <A>(l: Array<A>, r: Array<A>): Array<A> =>
    l.filter(isNot(includedIn(r)));


// TODO remove is a special case of subtract, try to, write either one in terms of the other
// TODO change signature to match the one of addTo
export const remove = <A>(as: Array<A>, a: A): Array<A> =>
    as.filter(differentFrom(a));


export const addTo = <A>(as: Array<A>) => (a: A): Array<A> =>
    (as.indexOf(a) > -1) ? as : as.concat([a]);


export const subtractTwo = <A>(sets: NestedArray<A>, other: Array<A>): Array<A> => {

    const result = JSON.parse(JSON.stringify(other));

    sets.forEach(set =>
        set.map(object =>
            result.indexOf(object))
            .filter(bigger(-1))
            .reverse()
            .forEach(removeAtIndex(result))
    );

    return result;
};


export const intersect = <A>(aas: NestedArray<A>): Array<A> =>
    aas.reduce((p, c) => p.filter(includedIn(c)));


export const union = (sets: NestedArray<any>) =>
    Object.keys(sets.reduce((result: any, set) => {
        set.forEach(item => result[item] = item);
        return result;
    }, {}));


export const includedIn =  <A>(as: Array<A>) => (a: A) => as.indexOf(a) != -1;


export const isNot = <A>(f: (_: A) => boolean) => (a: A) => flip(f(a));


export const takeWhile = <A>(f: (_: A) => boolean) => take(f, identical, 0);


export const takeUntil = <A>(f: (_: A) => boolean) => take(f, flip, 1);


export const is = <A>(l:A) =>
    (r:A) => l == r;


export const smaller = <A>(l:A) =>
    (r:A) => l > r;


export const bigger = <A>(l:A) =>
    (r:A) => l < r;


export const differentFrom = <A>(l:A) =>
    (r:A) => l != r;


// private


const identical = <A>(v: A) => v;


const flip = (v: boolean) => !v;


const take = <A>(predicate: (_: A) => boolean,
                 flipper: (predicateOutcome: boolean) => boolean,
                 indexOffset: number) => {

    return (arr: Array<A>) => {
        // implementation of takeWhile based on the idea taken from http://sufflavus.github.io/JS-Tips-Take-While
        let stopIndex = arr.length;
        arr.some((el: A, index: number) => (flipper(predicate(el))) ? false : (stopIndex = index, true));
        return arr.slice(0, stopIndex + indexOffset);
    }
};