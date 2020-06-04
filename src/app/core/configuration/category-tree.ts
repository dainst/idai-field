import {flatten, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Tree} from './tree';
import {namedArrayToNamedMap} from '../util/named';

const CATEGORIES = [0];


// This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
// and it is assumed that the tree is at most two levels deep
export type CategoryTree = Tree<Category>; // technically the same, but we want to make the distinction as to indicate the above-mentioned properties


/**
 * @param t expects instance relationships to be set
 *   between parents and children via 'parentCategory' and 'children',
 *   assuming there are at most two levels
 *
 * @returns an Array containing the original und unmodified Category instances from the Tree
 */
export function treeToCategoryArray(t: CategoryTree): Array<Category> {

    const parents = t.map(to(CATEGORIES));
    const children: Array<Category> = flatten(parents.map(to(Category.CHILDREN)));
    return parents.concat(children);
}


/**
 * @param t expects instance relationships to be set
 *   between parents and children via 'parentCategory' and 'children',
 *   assuming there are at most two levels
 *
 * @returns a Map containing the original und unmodified Category instances from the Tree
 */
export function treeToCategoryMap(t: CategoryTree): Map<Category> {

    return namedArrayToNamedMap(treeToCategoryArray(t))
}
