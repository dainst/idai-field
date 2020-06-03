import {Pair, Mapping} from 'tsfun';

export type Node<T> = Pair<T,Tree<T>>;

export type Tree<T> = Array<Node<T>>;


export function mapTree<A,B>(f: Mapping<A,B>, t: Tree<A>): Tree<B>;
export function mapTree<A,B>(f: Mapping<A,B>): Mapping<Tree<A>,Tree<B>>;
export function mapTree(...args: any[]): any {

    const inner = (f: any) => (t: any) => {

        const replacement = [];
        for (let [node,tree] of t) {
            replacement.push([f(node),mapTree(f,tree)]);
        }
        return replacement;
    }

    return args.length === 2
        ? inner(args[0])(args[1])
        : inner(args[0])
}


export function mapLeafs<A>(f: Mapping<Tree<A>>, t: Tree<A>): Tree<A> {

    return f(t).map(([node,leafs]) => [node,mapLeafs(f, leafs)]);
}
