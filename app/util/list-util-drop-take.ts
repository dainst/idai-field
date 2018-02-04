import {isNot} from './list-util-base';

/**
 * @author Daniel de Oliveira
 */


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