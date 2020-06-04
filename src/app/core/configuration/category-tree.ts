import {flatten, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Tree} from './tree';
import {namedArrayToNamedMap} from '../util/named';

const CATEGORIES = [0];


// This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
// and it is assumed that the tree is at most two levels deep
export type CategoryTree = Tree<Category>; // technically the same, but we want to make the distinction as to indicate the above-mentioned properties


/**
 * @param t expected to conform to the CategoryTree specification
 * @returns an Array containing the original und unmodified Category instances from the Tree
 */
export function categoryTreeToCategoryArray(t: CategoryTree): Array<Category> {

    const parents = t.map(to(CATEGORIES));
    const children: Array<Category> = flatten(parents.map(to(Category.CHILDREN)));
    return parents.concat(children);
}


/**
 * @param t expected to conform to the CategoryTree specification
 * @returns a Map containing the original und unmodified Category instances from the Tree
 */
export function categoryTreeToCategoryMap(t: CategoryTree): Map<Category> {

    return namedArrayToNamedMap(categoryTreeToCategoryArray(t))
}


/**
 * @param categories an at most two level deep Tree<Category>
 * @returns a CategoryTree according to its specified properties
 */
export function linkParentAndChildInstances(categories: Tree<Category> /* modified in place */): CategoryTree {

    for (let [category, children] of categories) {

        category.children = children.map(to(CATEGORIES));
        category.children.map(child => child.parentCategory = category);
    }
    return categories;
}
