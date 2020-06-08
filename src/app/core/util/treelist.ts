import {Mapping, Predicate, isFunction, first, isNumber, rest, isObject, isArray, Pair, to} from 'tsfun';
import {Comparator} from 'tsfun/by';


// Tree and Treelist data structures ////////////////

export type Tree<T> = {
    item: T,
    trees: Treelist<T>
}

export type Treelist<T> = Array<Tree<T>>;

export module Treelist {

    export module Tree {

        export const ITEM = 'item';
        export const TREES = 'trees';
    }
}

export const toTreeItem = to([Treelist.Tree.ITEM]);

// Tree and Treelist - END //////////////////////////



// ArrayTree and ArrayTreelist data structures //////
// Contrary to our Tree and Treelist data structures,
// this structure does not allow for distinguishing trees and
// treelists on the javascript level by virtue of them being either
// objects or arrays.
// However, this version reads much nicer and we use it to instantiate
// our trees in all tests. The builder functions also provides an indirection
// which protects the test code from possible changes to the tree data structure.

export type Node<ITEM,TREES> = Pair<ITEM,TREES>;

export type ArrayTree<T> = Node<T, ArrayTreelist<T>>;

export type ArrayTreelist<T> = Array<ArrayTree<T>>;

export function buildTreelist<T>(t: ArrayTreelist<T>): Treelist<T> {

    return t.map(([t,trees]) => ({ item: t, trees: buildTreelist(trees)}));
}

export function buildTree<T>([item, children]: ArrayTree<T>): Tree<T> {

    return {
        item: item,
        trees: children.map(([t,trees]) => ({ item: t, trees: buildTreelist(trees)}))
    };
}

// ArrayTree and ArrayTreelist - END ////////////////




export function mapTreelist<A,B>(f: Mapping<A,B>, t: Treelist<A>): Treelist<B>;
export function mapTreelist<A,B>(f: Mapping<A,B>): Mapping<Treelist<A>,Treelist<B>>;
export function mapTreelist(...args: any[]): any {

    const $ = (f: any) => (treelist: any) => {

        const replacement = [];
        for (let { item: t, trees: tree} of treelist) {
            replacement.push({ item: f(t), trees: mapTreelist(f, tree)});
        }
        return replacement;
    }

    return args.length === 2
        ? $(args[0])(args[1])
        : $(args[0])
}


export function mapTree<A,B>(f: Mapping<A,B>, t: Tree<A>): Tree<B>;
export function mapTree<A,B>(f: Mapping<A,B>): Mapping<Tree<A>,Tree<B>>;
export function mapTree(...args: any[]): any {

    const $ = (f: any) => (tree: any) => {

        return {
            item: f(tree.item),
            trees: mapTreelist(f, tree.trees)
        };
    }

    return args.length === 2
        ? $(args[0])(args[1])
        : $(args[0])
}


export function accessT<T>(t: Treelist<T>|Tree<T>, ...path: number[]): T {

    function _accessTree<T>(t: Tree<T>, path: number[], lastSegmentIsNumber: boolean): T {

        const segment = first(path);
        if (segment === undefined) return t.item;
        else if (isNumber(segment) && lastSegmentIsNumber) return _accessTree(t.trees[segment], rest(path), true);
        return _accessTreelist(t.trees, path);
    }

    function _accessTreelist<T>(t: Treelist<T>, path: number[]) {

        const segment = first(path);
        if (!isNumber(segment)) return t[0] as any;
        return _accessTree(t[segment], rest(path), true);
    }

    return isObject(t)
        ? _accessTree(t as Tree<T>, path, false)
        : _accessTreelist(t as Treelist<T>, path);
}


export function mapTrees<T>(f: Mapping<Treelist<T>>, t: Treelist<T>): Treelist<T> {

    return f(t).map(({ item: t, trees: children }) => ({ item: t, trees: mapTrees(f, children)}));
}


export function flattenTree<A>(t: Tree<A>|Treelist<A>): Array<A> {

    const reduced = ((isArray(t) ? t : (t as Tree<A>).trees) as Treelist<A>)
        .reduce((as, { item: a, trees: children }) => as.concat([a]).concat(flattenTree(children)), []);

    return (isArray(t) ? [] : [(t as Tree<A>).item]).concat(reduced);
}


export function findInTree<T>(match: T|Predicate<T>, t: Treelist<T>|Tree<T>, comparator?: Comparator): Tree<T>|undefined {

    if (isObject(t)) return findInTree(match, [t as any], comparator);

    for (let node of t) {

        const { item: t, trees: trees } = node;

        if (comparator !== undefined
            ? comparator(match)(t)
            : isFunction(match)
                ? (match as Predicate<T>)(t)
                : match === t) return node;

        const findResult = findInTree(match, trees, comparator);
        if (findResult) return findResult;
    }
    return undefined;
}
