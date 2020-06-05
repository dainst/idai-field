import {Pair, Mapping, Predicate, isFunction} from 'tsfun';
import {Comparator} from 'tsfun/by';


export type Tree<T> = Pair<T /* ITEM */, Treelist<T> /* CHILDREN */>;

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

    const inner = (f: any) => (t: any) => {

        const replacement = [];
        for (let [node,tree] of t) {
            replacement.push([f(node),mapTreelist(f,tree)]);
        }
        return replacement;
    }

    return args.length === 2
        ? inner(args[0])(args[1])
        : inner(args[0])
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


