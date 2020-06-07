import {Mapping, Predicate, isFunction, first, isNumber, rest, isObject, isArray} from 'tsfun';
import {Comparator} from 'tsfun/by';


export type Tree<T> = {
    t: T,
    trees: Treelist<T>
}

export type Treelist<T> = Array<Tree<T>>;


export module Treelist {

    export module Tree {

        export const T = 't';
        export const TREES = 'trees';
    }
}


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


export function accessT<T>(t: Treelist<T>|Tree<T>, ...path: number[]): T {

    function _accessTree<T>(t: Tree<T>, path: number[], lastSegmentIsNumber: boolean): T {

        const segment = first(path);
        if (segment === undefined) return t.t;
        else if (isNumber(segment) && lastSegmentIsNumber) return _accessTree(t.trees[segment], rest(path), true);
        return _accessTreelist(t.trees, path, true);
    }

    function _accessTreelist<T>(t: Treelist<T>, path: number[], lastSegmentIsNumber: boolean) {

        const segment = first(path);
        if (!isNumber(segment)) return t[0] as any;
        return _accessTree(t[segment], rest(path), true);
    }

    return isObject(t)
        ? _accessTree(t as Tree<T>, path, false)
        : _accessTreelist(t as Treelist<T>, path, false);
}


export function mapTrees<T>(f: Mapping<Treelist<T>>, t: Treelist<T>): Treelist<T> {

    return f(t).map(({ t: t, trees: children }) => ({ t: t, trees: mapTrees(f, children)}));
}


export function flattenTree<A>(t: Tree<A>|Treelist<A>): Array<A> {

    const reduced = ((isArray(t) ? t : (t as Tree<A>).trees) as Treelist<A>)
        .reduce((as, { t: a, trees: children }) => as.concat([a]).concat(flattenTree(children)), []);

    return (isArray(t) ? [] : [(t as Tree<A>).t]).concat(reduced);
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
