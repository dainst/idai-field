import { Category, CategoryForm, Field, Name, Valuelist } from 'idai-field-core';
import { CategoryFormIndex } from './category-form-index';
import { FieldIndex } from './field-index';
import { ValuelistIndex } from './valuelist-index';
import { ValuelistUsage, ValuelistUsageIndex } from './valuelist-usage-index';


export interface ConfigurationIndex {

    categoryFormIndex: CategoryFormIndex;
    fieldIndex: FieldIndex;
    valuelistIndex: ValuelistIndex;
    valuelistUsageIndex: ValuelistUsageIndex;
}


/**
 * @author Thomas Kleinke
 */
export namespace ConfigurationIndex {

    export function create(forms: Array<CategoryForm>, categories: Array<Category>,
                           commonFields: Array<Field>, valuelists: Array<Valuelist>,
                           usedCategories: Array<CategoryForm>): ConfigurationIndex {

        return {
            categoryFormIndex: CategoryFormIndex.create(forms),
            fieldIndex: FieldIndex.create(categories, commonFields),
            valuelistIndex: ValuelistIndex.create(valuelists),
            valuelistUsageIndex: ValuelistUsageIndex.create(valuelists, usedCategories)
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


    export function getValuelistUsage(index: ConfigurationIndex,
                                      valuelistId: string): Array<ValuelistUsage>|undefined {

        return ValuelistUsageIndex.get(index.valuelistUsageIndex, valuelistId);
    }
}
