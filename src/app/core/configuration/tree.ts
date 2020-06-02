import {Pair, Mapping} from 'tsfun';

export type Tree<T> = Array<Pair<T,Tree<T>>>;


export function mapTree<A,B>(f: Mapping<A,B>, t: Tree<A>): Tree<B> {

    const replacement = [];
    for (let [node,tree] of t) {
        replacement.push([f(node),mapTree(f,tree)]);
    }
    return replacement;
}
