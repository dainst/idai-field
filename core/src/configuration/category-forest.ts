import { CategoryForm } from '../model/configuration/category-form';
import { Forest, Tree } from '../tools/forest';


/**
 *
 * @returns a CategoryTree - This tree's CategoryForm instances are connected via 'parentCategory' and 'children' properties of CategoryForm
 */
export function linkParentAndChildInstances(categories: Forest<CategoryForm> /* modified in place */): Forest<CategoryForm> {

    for (let { item: category, trees: children } of categories) {

        category.children = children.map(Tree.toItem);
        category.children.map(child => child.parentCategory = category);
        linkParentAndChildInstances(children);
    }
    return categories;
}
