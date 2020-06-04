import {flatten, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Tree} from './tree';
import {namedArrayToNamedMap} from '../util/named';


const CATEGORIES = [0];


/**
 * @param t expects instance relationships to be set
 *   between parents and children via 'parentCategory' and 'children',
 *   assuming there are at most two levels
 *
 * @returns an Array containing the original und unmodified Category instances from the Tree
 */
export function treeToCategoryArray(t: Tree<Category>): Array<Category> {

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
export function treeToCategoryMap(t: Tree<Category>): Map<Category> {

    return namedArrayToNamedMap(treeToCategoryArray(t))
}
