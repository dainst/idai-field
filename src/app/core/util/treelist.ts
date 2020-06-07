import {Mapping, Predicate, isFunction, first, isNumber, rest} from 'tsfun';
import {Comparator} from 'tsfun/by';


export type Tree<T> = {
    t: T,
    trees: Treelist<T>
}

export type Treelist<T> = Array<Tree<T>>;


export module Treelist { // TODO review structure

    export module Tree {

        export const T = 't';
        export const TREES = 'trees';
    }
}


// TODO rename to mapTree and make it work for both Tree and Treelist
export function mapTreelist<A,B>(f: Mapping<A,B>, t: Treelist<A>): Treelist<B>;
export function mapTreelist<A,B>(f: Mapping<A,B>): Mapping<Treelist<A>,Treelist<B>>;
export function mapTreelist(...args: any[]): any {

    const $ = (f: any) => (treelist: any) => {

        const replacement = [];
        for (let { t: t, trees: tree} of treelist) {
            replacement.push({ t: f(t), trees: mapTreelist(f, tree)});
        }
        return replacement;
    }

    return args.length === 2
        ? $(args[0])(args[1])
        : $(args[0])
}


export function accessTreelist<T>(t: Treelist<T>, ...path: number[] /* TODO make 1 elem minimum */): T {

    function _accessTree<T>(t: Tree<T>, path: number[], lastSegmentIsNumber: boolean): T {

        const segment = first(path);
        if (segment === undefined) return t.t;
        else if (isNumber(segment) && lastSegmentIsNumber) return _accessTree(t.trees[segment], rest(path), true);
        return _accessTreelist(t.trees, rest(path), true);
    }

    function _accessTreelist<T>(t: Treelist<T>, path: number[], lastSegmentIsNumber: boolean) {

        const segment = first(path);
        if (!isNumber(segment)) return t[0] as any;
        return _accessTree(t[segment], rest(path), true);
    }

    return _accessTreelist(t, path, false);
}


export function mapTreelists<T>(f: Mapping<Treelist<T>>, t: Treelist<T>): Treelist<T> {

    return f(t).map(({ t: t, trees: children }) => ({ t: t, trees: mapTreelists(f, children)}));
}


export function flattenTreelist<A>(t: Treelist<A>): Array<A> {

    return t.reduce((as, { t: a, trees: children }) =>
         as.concat([a]).concat(flattenTreelist(children)), []);
}


export function findInTreelist<T>(match: T|Predicate<T>, t: Treelist<T>, comparator?: Comparator): Tree<T>|undefined {

    for (let node of t) {

        const { t: t, trees: trees } = node;

        if (comparator !== undefined
            ? comparator(match)(t)
            : isFunction(match)
                ? (match as Predicate<T>)(t)
                : match === t) return node;

        const findResult = findInTreelist(match, trees, comparator);
        if (findResult) return findResult;
    }
    return undefined;
}
