import { Name } from 'idai-field-core';
import { Map } from 'tsfun';
import { Valuelists } from '../../../../../../core/src/model/valuelist-definition';
import { assertFieldsAreValid } from '../boot/assert-fields-are-valid';
import { ConfigurationErrors } from '../boot/configuration-errors';
import { BaseCategoryDefinition, BaseFieldDefinition } from './base-category-definition';


/**
 * CategoryDefinition, as used in FormLibrary
 *
 * @author Daniel de Oliveira
 */
export interface LibraryCategoryDefinition extends BaseCategoryDefinition {

    color?: string,
    valuelists: Valuelists;
    positionValuelists?: Valuelists;
    commons: string[];
    parent?: string,
    categoryName: string;
    libraryId?: string;
    description: {[language: string]: string},
    createdBy: string,
    creationDate: string;
    fields: Map<LibraryFieldDefinition>;
}


export interface LibraryFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    positionValuelistId?: string;
}


const VALID_FIELD_PROPERTIES = [
    'inputType',
    'positionValues',
    'creationDate',
    'createdBy'
];


export module LibraryCategoryDefinition {

    export function makeAssertIsValid(builtinCategories: string[]) {

        return function assertIsValid([categoryName, category]: [Name, LibraryCategoryDefinition]) {

            if (category.description === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'description', categoryName];
            if (category.creationDate === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'creationDate', categoryName];
            if (category.createdBy === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'createdBy', categoryName];
            if (category.categoryName === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'categoryName', categoryName];
            if (category.commons === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'commons', categoryName];
            if (category.valuelists === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'valuelists', categoryName];

            if (!builtinCategories.includes(category.categoryName) && !category.parent) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'parent', categoryName];

            if (!category.fields) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'creationDate', categoryName];
            assertFieldsAreValid(category.fields, VALID_FIELD_PROPERTIES, 'library');
        }
    }
}
