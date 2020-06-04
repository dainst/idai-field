import {Pair, Mapping, reduce} from 'tsfun';


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


export function mapLeafs<A>(f: Mapping<Treelist<A>>, t: Treelist<A>): Treelist<A> {

    return f(t).map(([node,leafs]) => [node,mapLeafs(f, leafs)]);
}


export function flattenTreelist<A>(t: Treelist<A>): Array<A> {

    return t.reduce((as, [a, children]) =>
         as.concat([a]).concat(flattenTreelist(children)), []);
}

