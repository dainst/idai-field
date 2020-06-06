import {Pair, Mapping, Predicate, isFunction, first, isNumber, rest} from 'tsfun';
import {Comparator} from 'tsfun/by';


export type Node<ITEM, CHILDREN> = Pair<ITEM, CHILDREN>;

// TODO if we convert it like this:
// export type Tree<T> = { node: T, children: Treelist<T>> }
// then we can test unambiguously if we have a tree or a treelist,
// which means we could provide a unified map function for both
// to refactor, we first could provide accessors for tree elements
// which we then use in tests etc and behind which we encapsulate
// our tree implementation completely.
// afterward, we can change the structure and refactor the functions
// here to work both for tree and treelist
// note: the tree structure we use is a general tree
export type Tree<T> = Node<T, Treelist<T>>;

export type Treelist<T> = Array<Tree<T>>;


export module Treelist {

    export module Tree {

        export const ITEM = 0;
        export const CHILDREN = 1;
    }
}


export function mapTreelist<A,B>(f: Mapping<A,B>, t: Treelist<A>): Treelist<B>;
export function mapTreelist<A,B>(f: Mapping<A,B>): Mapping<Treelist<A>,Treelist<B>>;
export function mapTreelist(...args: any[]): any {

    const $ = (f: any) => (t: any) => {

        const replacement = [];
        for (let [node,tree] of t) {
            replacement.push([f(node),mapTreelist(f,tree)]);
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
        if (segment === undefined) return t[0];
        else if (isNumber(segment) && lastSegmentIsNumber) return _accessTree(t[1][segment], rest(path), true);
        return _accessTreelist(t[1], rest(path), true);
    }

    function _accessTreelist<T>(t: Treelist<T>, path: number[], lastSegmentIsNumber: boolean) {

        const segment = first(path);
        if (!isNumber(segment)) return t[0] as any;
        return _accessTree(t[segment], rest(path), true);
    }

    return _accessTreelist(t, path, false);
}


export function mapLeafs<T>(f: Mapping<Treelist<T>>, t: Treelist<T>): Treelist<T> {

    return f(t).map(([node,leafs]) => [node,mapLeafs(f, leafs)]);
}


export function flattenTreelist<A>(t: Treelist<A>): Array<A> {

    return t.reduce((as, [a, children]) =>
         as.concat([a]).concat(flattenTreelist(children)), []);
}


export function findInTreelist<T>(match: T|Predicate<T>, t: Treelist<T>, comparator?: Comparator): Tree<T>|undefined {

    for (let node of t) {

        const [item, children] = node;

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
