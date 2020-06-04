import {flatten, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Treelist} from './treelist';
import {namedArrayToNamedMap} from '../util/named';

const CATEGORIES = [0];


// This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
// and it is assumed that the tree is at most two levels deep
export type CategoryTreelist = Treelist<Category>; // technically the same, but we want to make the distinction as to indicate the above-mentioned properties


/**
 * @param t expected to conform to the CategoryTree specification
 * @returns an Array containing the original und unmodified Category instances from the Tree
 */
export function categoryTreelistToArray(t: CategoryTreelist): Array<Category> {

    const parents = t.map(to(CATEGORIES));
    const children: Array<Category> = flatten(parents.map(to(Category.CHILDREN)));
    return parents.concat(children);
}


/**
 * @param t expected to conform to the CategoryTree specification
 * @returns a Map containing the original und unmodified Category instances from the Tree
 */
export function categoryTreelistToMap(t: CategoryTreelist): Map<Category> {

    return namedArrayToNamedMap(categoryTreelistToArray(t))
}


/**
 * @returns a CategoryTree according to its specified properties
 */
export function linkParentAndChildInstances(categories: Treelist<Category> /* modified in place */): CategoryTreelist {

    for (let [category, children] of categories) {

        category.children = children.map(to(CATEGORIES));
        category.children.map(child => child.parentCategory = category);
        linkParentAndChildInstances(children);
    }
    return categories;
}
