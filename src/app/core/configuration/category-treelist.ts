import {Map, to} from 'tsfun';
import {Category} from './model/category';
import {flattenTree, toTreeItem, Treelist} from '../util/treelist';
import {namedArrayToNamedMap} from '../util/named';

const CATEGORIES = ['item'];


// This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
export type CategoryTreelist = Treelist<Category>; // technically the same, but we want to make the distinction as to indicate the above-mentioned property


/**
 * @param t expected to conform to the CategoryTree specification
 * @returns an Array containing the original und unmodified Category instances from the Tree
 */
export function categoryTreelistToArray(t: CategoryTreelist): Array<Category> {

    return flattenTree(t);
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

    for (let { item: category, trees: children } of categories) {

        category.children = children.map(toTreeItem);
        category.children.map(child => child.parentCategory = category);
        linkParentAndChildInstances(children);
    }
    return categories;
}
