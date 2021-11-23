import { Category, CategoryForm, Field, Name, Valuelist } from 'idai-field-core';
import { CategoryFormIndex } from './category-form-index';
import { FieldIndex } from './field-index';
import { ValuelistIndex } from './valuelist-index';


export interface ConfigurationIndex {

    categoryFormIndex: CategoryFormIndex;
    fieldIndex: FieldIndex;
    valuelistIndex: ValuelistIndex;
}


/**
 * @author Thomas Kleinke
 */
export namespace ConfigurationIndex {

    export function create(forms: Array<CategoryForm>, categories: Array<Category>,
                           commonFields: Array<Field>, valuelists: Array<Valuelist>): ConfigurationIndex {

        return {
            categoryFormIndex: CategoryFormIndex.create(forms),
            fieldIndex: FieldIndex.create(categories, commonFields),
            valuelistIndex: ValuelistIndex.create(valuelists)
        };
    }


    export function findCategoryForms(index: ConfigurationIndex, searchTerm: string, parentCategory?: Name,
                                      onlySupercategories?: boolean): Array<CategoryForm> {

        return CategoryFormIndex.find(index.categoryFormIndex, searchTerm, parentCategory, onlySupercategories);
    }


    export function findFields(index: ConfigurationIndex, searchTerm: string, categoryName: string): Array<Field> {

        return FieldIndex.find(index.fieldIndex, searchTerm, categoryName);
    }


    export function findValuelists(index: ConfigurationIndex, searchTerm: string): Array<Valuelist> {

        return ValuelistIndex.find(index.valuelistIndex, searchTerm);
    }
}
