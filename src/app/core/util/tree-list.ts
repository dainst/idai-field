import {
    Mapping,
    Predicate,
    isFunction,
    first,
    isNumber,
    rest,
    isObject,
    isArray,
    Pair,
    to,
    Path,
    is,
    zip, identity
} from 'tsfun';
import {Comparator} from 'tsfun';
import {Named} from './named';


export type Tree<T = any> = {
    item: T,
    trees: TreeList<T>
}

export type TreeList<T = any> = Array<Tree<T>>;

export module Tree {

    export const ITEM = 'item';
    export const TREES = 'trees';
}

export const ITEMPATH: Path = [Tree.ITEM];

export const ITEMNAMEPATH: Path = [Tree.ITEM, Named.NAME];

export const toTreeItem = to(ITEMPATH);

// Implementation note:
// Technically it would be no problem to have only a function mapTree
// (making mapTreeList superfluous) which maps both Tree and TreeList.
// But the two argument list version would then return Mapping<Tree|TreeList>
// which would then lead to the problem that we needed to disambiguate typewise
// in flows, which we want to avoid  (same consideration which in tsfun led
// to having various packages containing various functions versions).

export function mapTreeList<A,B>(f: Mapping<A,B>, t: TreeList<A>): TreeList<B>;
export function mapTreeList<A,B>(f: Mapping<A,B>): Mapping<TreeList<A>,TreeList<B>>;
export function mapTreeList(...args: any[]): any {

    const $ = (f: any) => (treeList: any) => {

        const replacement = [];
        for (let { item: t, trees: tree} of treeList) {
            replacement.push({ item: f(t), trees: mapTreeList(f, tree)});
        }
        return replacement;
    };

    return args.length === 2
        ? $(args[0])(args[1])
        : $(args[0]);
}


export function zipTreeList<T>(ts: Array<TreeList<T>>): TreeList<Array<T>>;
export function zipTreeList<T>(zipItems: (items: Array<T>) => T, ts: Array<TreeList<T>>): TreeList<T>;
export function zipTreeList<T>(...args: any): any {

    const $ = (zipItems: any) =>
        (ts: Array<TreeList<T>>) => zip(ts).map((ns: any[]) =>
        ({
            item: zipItems(ns.map(to(Tree.ITEM))),
            trees: zipTreeList(zipItems, ns.map(to(Tree.TREES)))
        })
    );

    return args.length > 1 && isFunction(args[0])
        ? $(args[0])(args[1])
        : $(identity)(args[0])
}


export function mapTree<A,B>(f: Mapping<A,B>, t: Tree<A>): Tree<B>;
export function mapTree<A,B>(f: Mapping<A,B>): Mapping<Tree<A>,Tree<B>>;
export function mapTree(...args: any[]): any {

    const $ = (f: any) => (tree: any) => {

        return {
            item: f(tree.item),
            trees: mapTreeList(f, tree.trees)
        };
    };

    return args.length === 2
        ? $(args[0])(args[1])
        : $(args[0]);
}


export function accessTree<T>(t: TreeList<T>|Tree<T>, ...path: number[]): T {

    function _accessTree<T>(t: Tree<T>, path: number[]): T {

        const segment = first(path);
        if (segment === undefined) return t.item;
        else if (isNumber(segment)) return _accessTree(t.trees[segment], rest(path));
        return _accessTreelist(t.trees, path);
    }

    function _accessTreelist<T>(t: TreeList<T>, path: number[]) {

        const segment = first(path);
        if (!isNumber(segment)) return t[0] as any;
        return _accessTree(t[segment], rest(path));
    }

    return (isObject(t)
        ? _accessTree
        : _accessTreelist as any)(t as Tree<T>, path);
}


export function mapTrees<T>(f: Mapping<TreeList<T>>, t: TreeList<T>): TreeList<T> {

    return f(t).map(({ item: t, trees: children }) => ({ item: t, trees: mapTrees(f, children)}));
}


export function flattenTree<A>(t: Tree<A>|TreeList<A>): Array<A> {

    const reduced = ((isArray(t) ? t : (t as Tree<A>).trees) as TreeList<A>)
        .reduce((as, { item: a, trees: children }) => as.concat([a]).concat(flattenTree(children)), []);

    return (isArray(t) ? [] : [(t as Tree<A>).item]).concat(reduced);
}


export function findInTree<T>(t: TreeList<T>|Tree<T>,
                              match: T|Predicate<T>,
                              comparator?: Comparator): Tree<T>|undefined {

    if (isObject(t)) return findInTree([t as any], match, comparator);

    for (let node of t) {
        const { item: t, trees: trees } = node;

        const matches: Predicate<T> = buildMatches(match, comparator);
        if (matches(t)) return node;

        const findResult = findInTree(trees, match, comparator);
        if (findResult) return findResult;
    }
    return undefined;
}


function buildMatches<T>(match: T|Predicate<T>, comparator?: Comparator): Predicate<T> {

    return comparator !== undefined
        ? comparator(match)
        : isFunction(match)
            ? (match as Predicate<T>)
            : is(match);
}


// ArrayTree and ArrayTreeList data structures //////
//
// In contrast to our Tree and TreeList data structures
// this structure does not allow for distinguishing trees and
// tree lists on the javascript level by virtue of them being either
// objects or arrays.
// However, this version reads much nicer and we use it to instantiate
// our trees in all tests. The builder functions also provides an indirection
// which protects the test code from possible changes to the tree data structure.

export type Node<ITEM,TREES> = Pair<ITEM,TREES>;

export type ArrayTree<T = any> = Node<T, ArrayTreeList<T>>;

export type ArrayTreeList<T = any> = Array<ArrayTree<T>>;

export function buildTreeList<T>(t: ArrayTreeList<T>): TreeList<T> {

    return t.map(([t,trees]) => ({ item: t, trees: buildTreeList(trees)}));
}

export function buildTree<T>([item, children]: ArrayTree<T>): Tree<T> {

    return {
        item: item,
        trees: children.map(([t,trees]) => ({ item: t, trees: buildTreeList(trees)}))
    };
}


