import {isNot} from './list-util-base';

/**
 * @author Daniel de Oliveira
 */


export const take = <A>(n: number) =>
    (as: Array<A>) =>
        n < 0 ? [] :
            as.reduce((acc: Array<A>, val, i) =>
                i < n ? acc.concat([val]) : acc
                , []);


export const takeWhile = <A>(predicate: (_: A) => boolean) =>
    (as: Array<A>) => {
        let go = true;
        return as.reduce((acc: Array<A>, a) =>
            go && predicate(a) ? acc.concat([a]) : (go = false, acc), []);
    };


export const takeRightWhile = <A>(predicate: (_: A) => boolean) =>
    (as: Array<A>) => {
        let go = true;
        return as.reduceRight((acc: Array<A>, a) =>
            go && predicate(a) ? [a].concat(acc) : (go = false, acc), []);
    };


export const takeUntil = <A>(predicate: (_: A) => boolean) =>
    (as: Array<A>) => {
        const found = as.find(predicate);
        return found ?
            takeWhile(isNot(predicate))(as).concat([found])
            : as
    };


export const dropWhile = <A>(predicate: (_: A) => boolean) =>
    (as: Array<A>) => {
        let go = false;
        return as.reduce((acc: Array<A>, a) =>
            go || !predicate(a) ? (go = true, acc.concat([a])) : acc, []);
    };