import {flatten, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Tree} from './tree';
import {namedArrayToNamedMap} from '../util/named';


export function treeToCategoryArray(t: Tree<Category>): Array<Category> {

    const go = (t: Tree<Category>) => {

        const m = [];
        for (let [node,tree] of t) {
            node.children = go(tree);
            m.push(node);
        }
        return m;
    }

    const result = go(t);
    const children: Array<Category> = flatten(result.map(to(Category.CHILDREN)));
    return result.concat(children);
}


export function treeToCategoryMap(t: Tree<Category>): Map<Category> {

    return namedArrayToNamedMap(treeToCategoryArray(t))
}
