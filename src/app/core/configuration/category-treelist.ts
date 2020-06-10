import {Category} from './model/category';
import {toTreeItem, Treelist} from '../util/treelist';


/**
 *
 * @returns a CategoryTree - This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
 */
export function linkParentAndChildInstances(categories: Treelist<Category> /* modified in place */): Treelist<Category> {

    for (let { item: category, trees: children } of categories) {

        category.children = children.map(toTreeItem);
        category.children.map(child => child.parentCategory = category);
        linkParentAndChildInstances(children);
    }
    return categories;
}
