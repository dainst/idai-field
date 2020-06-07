import {Pair, Mapping, Predicate, isFunction, first, isNumber, rest} from 'tsfun';
import {Comparator} from 'tsfun/by';

// TODO make constructor with which the refactoring of the tests could have been easier, for example a convert method between the different literal variants of defining the tree


export type Tree<T> = { node: T, /* TODO rename to trees */ children: Treelist<T> }

export type Treelist<T> = Array<Tree<T>>;


export module Treelist {

    export module Tree {

        export const ITEM = 0;
        export const CHILDREN = 1;
    }
}


// TODO rename to mapTree and make it work for both Tree and Treelist
export function mapTreelist<A,B>(f: Mapping<A,B>, t: Treelist<A>): Treelist<B>;
export function mapTreelist<A,B>(f: Mapping<A,B>): Mapping<Treelist<A>,Treelist<B>>;
export function mapTreelist(...args: any[]): any {

    const $ = (f: any) => (t: any) => {

        const replacement = [];
        for (let { node: node, children: tree} of t) {
            replacement.push({ node: f(node), children: mapTreelist(f,tree)});
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
        if (segment === undefined) return t.node;
        else if (isNumber(segment) && lastSegmentIsNumber) return _accessTree(t.children[segment], rest(path), true);
        return _accessTreelist(t.children, rest(path), true);
    }

    function _accessTreelist<T>(t: Treelist<T>, path: number[], lastSegmentIsNumber: boolean) {

        const segment = first(path);
        if (!isNumber(segment)) return t[0] as any;
        return _accessTree(t[segment], rest(path), true);
    }

    return _accessTreelist(t, path, false);
}


export function mapTreelists<T>(f: Mapping<Treelist<T>>, t: Treelist<T>): Treelist<T> {

    return f(t).map(({ node: node, children: children }) => ({ node: node, children: mapTreelists(f, children)}));
}


export function flattenTreelist<A>(t: Treelist<A>): Array<A> {

    return t.reduce((as, { node: a, children: children }) =>
         as.concat([a]).concat(flattenTreelist(children)), []);
}


export function findInTreelist<T>(match: T|Predicate<T>, t: Treelist<T>, comparator?: Comparator): Tree<T>|undefined {

    for (let node of t) {

        const { node: item, children: children } = node;

        if (comparator !== undefined
            ? comparator(match)(item)
            : isFunction(match)
                ? (match as Predicate<T>)(item)
                : match === item) return node;

        const findResult = findInTreelist(match, children, comparator);
        if (findResult) return findResult;
    }
    return undefined;
}
