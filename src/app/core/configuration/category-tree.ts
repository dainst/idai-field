import {flatten, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Tree} from './tree';
import {namedArrayToNamedMap} from '../util/named';


/**
 * Converts the Tree to an array and links the instances via 'parentCategory' and 'children'.
 * The resulting Array contains all categories, from all levels of the original Tree.
 */
export function treeToCategoryArray(t: Tree<Category>): Array<Category> {

    const go = (t: Tree<Category>, parentCategory?: Category) => {

        const m = [];
        for (let [node,tree] of t) {
            if (parentCategory) node.parentCategory = parentCategory;
            node.children = go(tree, node);
            m.push(node);
        }
        return m;
    }

    const result = go(t);
    const children: Array<Category> = flatten(result.map(to(Category.CHILDREN)));
    return result.concat(children);
}


/**
 * Converts the Tree to a map and links the instances via 'parentCategory' and 'children'.
 * The resulting Map contains all categories, from all levels of the original Tree.
 */
export function treeToCategoryMap(t: Tree<Category>): Map<Category> {

    return namedArrayToNamedMap(treeToCategoryArray(t))
}
