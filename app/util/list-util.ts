/**
 * @author Daniel de Oliveira
 */

export type NestedArray<A> = Array<Array<A>>;


export const getAtIndex = <A>(as: Array<A>, i: number): A|undefined => getAtIndexOr(as, i);


export const getAtIndexOr = <A>(as: Array<A>, i: number, defaultValue: A|undefined = undefined): A|undefined =>
    as.length < i ? defaultValue : as[i];


export const removeAtIndex = <A>(as: Array<A>) => (i: number) => as.splice(i, 1);


export const subtract = <A>(...subtrahends: Array<Array<A>>) =>
    subtractNested(subtrahends);


export const subtractNested = <A>(subtrahends: NestedArray<A>) =>
    (as: Array<A>): Array<A> =>
        subtrahends.reduce(
            (acc, val) => _subtract(val)(acc),
            as);


export const removeFrom = <A>(as: Array<A>) => (a: A): Array<A> =>
    _subtract([a])(as);


export const addUniqueTo = <A>(as: Array<A>) => (a: A): Array<A> =>
    as.includes(a) ? as : as.concat([a]);


export const intersectWith = <A>(a1: Array<A>) =>
    (a2: Array<A>) => a1.filter(includedIn(a2));


export const intersect = <A>(aas: NestedArray<A>): Array<A> =>
    aas.reduce((acc, val) => intersectWith(acc)(val));


/**
 * @returns the union of a1 and a2
 */
export const uniteWith = <A>(a1: Array<A>) =>
    (a2: Array<A>) =>
        a1.concat(
            a2.filter(isNot(includedIn(a1))));


export const unite = <A>(aas: NestedArray<A>): Array<A> =>
    aas.length < 1 ? [] :
        aas.reduce((acc, val) => val ? uniteWith(acc)(val) : acc);


export const includedIn =  <A>(as: Array<A>) =>
    (a: A) => as.includes(a);


export const isNot = <A>(f: (_: A) => boolean) =>
    (a: A) => flip(f(a));


export const takeWhile = <A>(f: (_: A) => boolean) =>
    (as: Array<A>) => {
        let go = true;
        return as.reduce((acc: Array<A>, a) =>
            go && f(a) ? acc.concat([a]) : (go = false, acc), []);
    };


export const takeRightWhile = <A>(f: (_: A) => boolean) =>
    (as: Array<A>) => {
        let go = true;
        return as.reduceRight((acc: Array<A>, a) =>
            go && f(a) ? [a].concat(acc) : (go = false, acc), []);
    };


export const takeUntil = <A>(f: (_: A) => boolean) =>
    (as: Array<A>) => {
        const found = as.find(f);
        return found ?
            takeWhile(isNot(f))(as).concat([found])
            : as
    };


export const dropWhile = <A>(f: (_: A) => boolean) =>
    (as: Array<A>) => {
        let go = false;
        return as.reduce((acc: Array<A>, a) =>
            go || !f(a) ? (go = true, acc.concat([a])) : acc, []);
    };


export const sameAs = <A>(l:A) =>
    (r:A) => l == r;


export const smaller = <A>(l:A) =>
    (r:A) => l > r;


export const bigger = <A>(l:A) =>
    (r:A) => l < r;


export const times = (l: number) =>
    (r: number) => l * r;


export const differentFrom = <A>(a:A) =>
    isNot(sameAs(a));


export const map = <A>(f: (_: A) => A) =>
    (as: Array<A>) => as.map(f);


export const filter = <A>(f: (_: A) => boolean) =>
    (as: Array<A>) => as.filter(f);


export const reverse = <A>(as: Array<A>) => as.reverse();


export const flow = <A>(...fs: Array<(_: Array<A>) => Array<A>>) =>
    (collection: Array<A>): Array<A> =>
        fs.reduce((acc, f) => f(acc), collection);


// private

/**
 * Generate a new list with elements which are contained in l but not in subtrahend
 */
const _subtract = <A>(subtrahend: Array<A>) =>
    (l: Array<A>): Array<A> =>
        l.filter(isNot(includedIn(subtrahend)));


const identical = <A>(v: A) => v;


const flip = (v: boolean) => !v;


