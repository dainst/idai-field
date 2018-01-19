/**
 * @author Daniel de Oliveira
 */

export type NestedArray<T> = Array<Array<T>>;


/**
 * Generate a new list with elements which are contained in l but not in r
 */
export const subtract = <A>(l: Array<A>, r: Array<A>): Array<A> => {

    return l.filter(item => r.indexOf(item) === -1);
};


export const add = <A>(list: A[], item: A): Array<A> => {

    return (list.indexOf(item) > -1) ? list : list.concat([item]);
};


export const remove = <A>(list: A[], item: A): Array<A> => {

    return list.filter(itm => itm != item);
};


export const subtractTwo = <A>(sets: NestedArray<A>, other: Array<A>): Array<A> => {

    const result = JSON.parse(JSON.stringify(other));

    sets.forEach(set =>
        set.map(object =>
            result.indexOf(object))
            .filter(i => i > -1)
            .reverse()
            .forEach(i => result.splice(i, 1))
    );

    return result;
};


export const intersect = <A>(a: NestedArray<A>): Array<A> => {

    return a.reduce((p, c) =>
        p.filter(e =>
            c.map(r => r).indexOf(e) !=- 1
        )
    );
};


export const union = (sets: NestedArray<any>) => {

    return Object.keys(sets.reduce((result: any, set) => {
        set.forEach(item => result[item] = item);
        return result;
    }, {}));
};


export const contains = <A>(element: A) =>  (l: Array<A>) => l.indexOf(element) != -1;


export const takeWhile = <A>(f: (_: A) => boolean) => take(n => n, 0, f);


export const takeUntil = <A>(f: (_: A) => boolean) => take(n => !n, 1, f);


const take = <A>(n: (v: boolean) => boolean, add: number, f: (_: A) => boolean) => (arr: Array<A>) => {

    // implementation of takeWhile based on the idea taken from http://sufflavus.github.io/JS-Tips-Take-While
    let stopIndex = arr.length;
    arr.some((el: A, index: number) => (n(f(el))) ? false : (stopIndex = index, true));
    return arr.slice(0, stopIndex + add);
};


export const is = <A>(l:A) => (r:A) => l == r;


export const smaller = <A>(l:A) => (r:A) => l > r;


export const bigger = <A>(l:A) => (r:A) => l < r;