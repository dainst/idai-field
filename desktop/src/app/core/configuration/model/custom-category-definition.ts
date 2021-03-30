import { Name } from 'idai-field-core';
import { includedIn, isNot, Map, throws } from 'tsfun';
import { Valuelists } from '../../../../../../core/src/model/valuelist-definition';
import { assertFieldsAreValid } from '../boot/assert-fields-are-valid';
import { ConfigurationErrors } from '../boot/configuration-errors';
import { BaseCategoryDefinition, BaseFieldDefinition } from './base-category-definition';


/**
 * CategoryDefinition, as provided by users.
 *
 * @author Daniel de Oliveira
 */
export interface CustomCategoryDefinition extends BaseCategoryDefinition {

    valuelists?: Valuelists,
    commons?: string[];
    color?: string,
    hidden?: string[];
    parent?: string,
    fields: Map<CustomFieldDefinition>;
}


export interface CustomFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    positionValues?: string;
}

export module CustomFieldDefinition {

    export const INPUTTYPE = 'inputType';
}


const VALID_CATEGORY_PROPERTIES = ['valuelists', 'positionValuelists', 'commons', 'color', 'hidden', 'parent', 'fields'];

const VALID_FIELD_PROPERTIES = ['inputType', 'creationDate', 'createdBy'];


export module CustomCategoryDefinition {

    export const VALUELISTS = 'valuelists';
    export const PARENT = 'parent';

    export function makeAssertIsValid(builtinCategories: string[], libraryCategories: string[]) {

        return function assertIsValid([categoryName, category]: [Name, CustomCategoryDefinition]) {

            Object.keys(category)
                .filter(isNot(includedIn(VALID_CATEGORY_PROPERTIES)))
                .map(fieldName => [ConfigurationErrors.ILLEGAL_CATEGORY_PROPERTY, fieldName, categoryName])
                .forEach(throws());

            if (!builtinCategories.includes(categoryName) && !libraryCategories.includes(categoryName)) {
                if (!category.parent) {
                    throw [
                        ConfigurationErrors.MISSING_CATEGORY_PROPERTY,
                        CustomCategoryDefinition.PARENT,
                        categoryName,
                        'must be set for new categories'
                    ];
                }
            } else {
                if (category.parent) {
                    throw [
                        ConfigurationErrors.ILLEGAL_CATEGORY_PROPERTY,
                        CustomCategoryDefinition.PARENT,
                        categoryName,
                        'must not be set if not a new category'
                    ];
                }
            }

            if (!category.fields) {
                throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, BaseCategoryDefinition.FIELDS, category];
            }
            assertFieldsAreValid(category.fields, VALID_FIELD_PROPERTIES, 'custom');
        }
    }
}
