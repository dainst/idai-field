import { CategoryForm } from 'idai-field-core';


export interface CategoryFormChildrenIndex {

    [parentName: string]: Array<CategoryForm>;
}


/**
 * @author Thomas Kleinke
 */
export namespace CategoryFormChildrenIndex {

    export function create(categoryForms: Array<CategoryForm>): CategoryFormChildrenIndex {

        return categoryForms.reduce((index, categoryForm) => {
            if (categoryForm.parentCategory) {
                const parent: string = categoryForm.parentCategory.name;
                if (!index[parent]) index[parent] = [];
                index[parent].push(categoryForm);
            }
            return index;
        }, {});
    }


    export function getChildren(index: CategoryFormChildrenIndex, parentName: string): Array<CategoryForm> {

        return index[parentName] ?? [];
    }
}
