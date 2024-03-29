import { Mapping, Predicate, isFunction, first, isNumber, rest, isObject, isArray, Pair, to, Path, is, Comparator,
    identity } from 'tsfun';
import * as tsfun from 'tsfun';
import { Named } from './named';


export type Tree<T = any> = {
    item: T,
    trees: Forest<T>
}

export type Forest<T = any> = Array<Tree<T>>;


// ArrayTree and ArrayForest data structures //////
//
// In contrast to our Tree and Forest data structures
// this structure does not allow for distinguishing trees and
// tree lists on the javascript level by virtue of them being either
// objects or arrays.
// However, this version reads much nicer and we use it to instantiate
// our trees in all tests. The builder functions also provides an indirection
// which protects the test code from possible changes to the tree data structure.

export type Node<ITEM,TREES> = Pair<ITEM,TREES>;

export type ArrayTree<T = any> = Node<T, ArrayForest<T>>;

export type ArrayForest<T = any> = Array<ArrayTree<T>>;


/**
 * A forest of general trees
 * 
 * @author Daniel de Oliveira
 */
export namespace Forest {

    export const wrap = <T>(items: Array<T>): Forest<T> => items.map(Tree.wrap);

    // Implementation note:
    // Technically it would be no problem to have only a function mapTree
    // (making mapForest superfluous) which maps both Tree and Forest.
    // But the two argument list version would then return Mapping<Tree|Forest>
    // which would then lead to the problem that we needed to disambiguate typewise
    // in flows, which we want to avoid  (same consideration which in tsfun led
    // to having various packages containing various functions versions).

    export function map<A,B>(f: Mapping<A,B>, t: Forest<A>): Forest<B>;
    export function map<A,B>(f: Mapping<A,B>): Mapping<Forest<A>,Forest<B>>;
    export function map(...args: any[]): any {

        const $ = (f: any) => (forest: any) => {

            const replacement = [];
            for (let { item: t, trees: tree } of forest) {
                replacement.push({ item: f(t), trees: map(f, tree) });
            }
            return replacement;
        };

        return args.length === 2
            ? $(args[0])(args[1])
            : $(args[0]);
    }


    export function zip<T>(ts: Array<Forest<T>>): Forest<Array<T>>;
    export function zip<T>(zipItems: (items: Array<T>) => T, ts: Array<Forest<T>>): Forest<T>;
    export function zip<T>(...args: any): any {

        const $ = (zipItems: any) =>
            (ts: Array<Forest<T>>) => tsfun.zip(ts).map((ns: any[]) =>
            ({
                item: zipItems(ns.map(to(Tree.ITEM))),
                trees: zip(zipItems, ns.map(to(Tree.TREES)))
            })
        );

        return args.length > 1 && isFunction(args[0])
            ? $(args[0])(args[1])
            : $(identity)(args[0])
    }


    export function build<T>(t: ArrayForest<T>): Forest<T> {

        return t.map(([t,trees]) => ({ item: t, trees: build(trees)}));
    }
}


/**
 * A general tree
 * 
 * @author Daniel de Oliveira
 */
export namespace Tree {

    export const ITEM = 'item';
    export const TREES = 'trees';

    export const ITEMNAMEPATH: Path = [Tree.ITEM, Named.NAME];

    export const toItem = to(Tree.ITEM);

    export const wrap = <T>(item: T): Tree<T> => ({ item: item, trees: [] });


    export function map<A,B>(f: Mapping<A,B>, t: Tree<A>): Tree<B>;
    export function map<A,B>(f: Mapping<A,B>): Mapping<Tree<A>,Tree<B>>;
    export function map(...args: any[]): any {

        const $ = (f: any) => (tree: any) => {

            return {
                item: f(tree.item),
                trees: Forest.map(f, tree.trees)
            };
        };

        return args.length === 2
            ? $(args[0])(args[1])
            : $(args[0]);
    }


    export function access<T>(t: Forest<T>|Tree<T>, ...path: number[]): T {

        function _accessTree<T>(t: Tree<T>, path: number[]): T {

            const segment = first(path);
            if (segment === undefined) return t.item;
            else if (isNumber(segment)) return _accessTree(t.trees[segment], rest(path));
            return _accessForest(t.trees, path);
        }

        function _accessForest<T>(t: Forest<T>, path: number[]) {

            const segment = first(path);
            if (!isNumber(segment)) return t[0] as any;
            return _accessTree(t[segment], rest(path));
        }

        return (isObject(t)
            ? _accessTree
            : _accessForest as any)(t as Tree<T>, path);
    }


    export function mapTrees<T>(f: Mapping<Forest<T>>, t: Forest<T>): Forest<T> {

        return f(t).map(({ item: t, trees: children }) => ({ item: t, trees: mapTrees(f, children)}));
    }


    export function flatten<A>(t: Tree<A>|Forest<A>): Array<A> {

        const reduced = ((isArray(t) ? t : (t as Tree<A>).trees) as Forest<A>)
            .reduce((as, { item: a, trees: children }) => as.concat([a]).concat(flatten(children)), []);

        return (isArray(t) ? [] : [(t as Tree<A>).item]).concat(reduced);
    }


    export function find<T>(t: Forest<T>|Tree<T>,
                            match: T|Predicate<T>,
                            comparator?: Comparator): Tree<T>|undefined {

        if (isObject(t)) return find([t as any], match, comparator);

        for (let node of (t as any)) {
            const { item: t, trees: trees } = node;

            const matches: Predicate<T> = buildMatches(match, comparator);
            if (matches(t)) return node;

            const findResult = find(trees, match, comparator);
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

    
    export function build<T>([item, children]: ArrayTree<T>): Tree<T> {

        return {
            item: item,
            trees: children.map(([t,trees]) => ({ item: t, trees: Forest.build(trees)}))
        };
    }
}
