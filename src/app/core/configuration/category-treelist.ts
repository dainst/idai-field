import {is, Map, on, to} from 'tsfun';
import {Category} from './model/category';
import {findInTreelist, flattenTreelist, Tree, Treelist} from './treelist';
import {Named, namedArrayToNamedMap} from '../util/named';
import {Name} from '../constants';

const CATEGORIES = [0];


// This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
export type CategoryTreelist = Treelist<Category>; // technically the same, but we want to make the distinction as to indicate the above-mentioned property


/**
 * @param t expected to conform to the CategoryTree specification
 * @returns an Array containing the original und unmodified Category instances from the Tree
 */
export function categoryTreelistToArray(t: CategoryTreelist): Array<Category> {

    return flattenTreelist(t);
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


export function findInCategoryTreelist(category: Name, t: CategoryTreelist): Category|undefined {

    const result = findInTreelist(on(Named.NAME, is(category)), t);
    return result ? result[0] : undefined;
}
