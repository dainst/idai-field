import {Category} from './model/category';
import {Tree, TreeList} from '@idai-field/core';


/**
 *
 * @returns a CategoryTree - This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
 */
export function linkParentAndChildInstances(categories: TreeList<Category> /* modified in place */): TreeList<Category> {

    for (let { item: category, trees: children } of categories) {

        category.children = children.map(Tree.toItem) as any /* TODO review any*/;
        category.children.map(child => child.parentCategory = category);
        linkParentAndChildInstances(children);
    }
    return categories;
}
