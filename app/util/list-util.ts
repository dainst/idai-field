/**
 * @author Daniel de Oliveira
 */

export type NestedArray<T> = Array<Array<T>>;


export const getAtIndex = <A>(array: Array<A>, index: number): A|undefined => getAtIndexOr(array, index);


export const getAtIndexOr = <A>(array: Array<A>, index: number, defaultValue: A|undefined = undefined): A|undefined =>
    array.length < index ? defaultValue : array[index];


/**
 * Generate a new list with elements which are contained in l but not in r
 */
export const subtract = <A>(l: Array<A>, r: Array<A>): Array<A> =>
    l.filter(isNot(includedIn(r)));


export const add = <A>(as: Array<A>, a: A): Array<A> =>
    (as.indexOf(a) > -1) ? as : as.concat([a]);



export const remove = <A>(as: Array<A>, a: A): Array<A> =>
    as.filter(differentFrom(a));



export const subtractTwo = <A>(sets: NestedArray<A>, other: Array<A>): Array<A> => {

    const result = JSON.parse(JSON.stringify(other));

    sets.forEach(set =>
        set.map(object =>
            result.indexOf(object))
            .filter(bigger(-1))
            .reverse()
            .forEach(removeFrom(result))
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



export const includedIn =  <A>(l: Array<A>) => (element: A) => l.indexOf(element) != -1;


export const isNot = <A>(f: (_: A) => boolean) => (a: A) => flip(f(a));


export const takeWhile = <A>(f: (_: A) => boolean) => take(identical, f, 0);


export const takeUntil = <A>(f: (_: A) => boolean) => take(flip, f, 1);


export const is = <A>(l:A) =>
    (r:A) => l == r;


export const smaller = <A>(l:A) =>
    (r:A) => l > r;


export const bigger = <A>(l:A) =>
    (r:A) => l < r;


export const differentFrom = <A>(l:A) =>
    (r:A) => l != r;


// private


const removeFrom = <A>(l: Array<A>) => (i: number) => l.splice(i, 1);


const identical = <A>(v: A) => v;


const flip = (v: boolean) => !v;


const take = <A>(n: (v: boolean) => boolean, f: (_: A) => boolean, add: number) =>
    (arr: Array<A>) => {
        // implementation of takeWhile based on the idea taken from http://sufflavus.github.io/JS-Tips-Take-While
        let stopIndex = arr.length;
        arr.some((el: A, index: number) => (n(f(el))) ? false : (stopIndex = index, true));
        return arr.slice(0, stopIndex + add);
    };