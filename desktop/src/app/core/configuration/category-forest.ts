import {Tree, Forest, Category} from 'idai-field-core';


/**
 *
 * @returns a CategoryTree - This tree's category instances are connected via 'parentCategory' and 'children' properties of Category
 */
export function linkParentAndChildInstances(categories: Forest<Category> /* modified in place */): Forest<Category> {

    for (let { item: category, trees: children } of categories) {

        category.children = children.map(Tree.toItem);
        category.children.map(child => child.parentCategory = category);
        linkParentAndChildInstances(children);
    }
    return categories;
}
