import { CategoryForm, Name } from 'idai-field-core';
import { CategoryFormIndex } from './category-form-index';


export interface ConfigurationIndex {

    categoryFormIndex: CategoryFormIndex;
}


/**
 * @author Thomas Kleinke
 */
export namespace ConfigurationIndex {

    export function create(contextIndependentCategories: Array<CategoryForm>): ConfigurationIndex {

        return {
            categoryFormIndex: CategoryFormIndex.create(contextIndependentCategories)
        };
    }


    export function findCategoryForms(index: ConfigurationIndex, searchTerm: string, parentCategory?: Name,
                                      onlySupercategories?: boolean): Array<CategoryForm> {

        return CategoryFormIndex.find(index.categoryFormIndex, searchTerm, parentCategory, onlySupercategories);
    }
}
