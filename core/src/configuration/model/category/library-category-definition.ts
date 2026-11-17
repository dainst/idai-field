import { Map } from 'tsfun';
import { BaseCategoryDefinition } from './base-category-definition';
import { LibraryFieldDefinition } from '../field/library-field-definition';
import { LibraryFormDefinition } from '../form/library-form-definition';
import { I18N } from '../../../tools/i18n';
import { Name } from '../../../tools/named';
import { ConfigurationErrors } from '../../boot/configuration-errors';
import { assertFieldsAreValid } from '../field/assert-fields-are-valid';
import { VALID_LIBRARY_FIELD_PROPERTIES } from '../field/library-field-definition';


export interface LibraryCategoryDefinition extends BaseCategoryDefinition {

    fields: Map<LibraryFieldDefinition>;
    minimalForm?: LibraryFormDefinition;
    description: I18N.String;
    defaultRange?: { [relationName: string]: string[] };
}


export namespace LibraryCategoryDefinition {

    export const PARENT = 'parent';

    
    export function makeAssertIsValid(builtInCategoryNames: string[]) {

        return ([categoryName, category]: [Name, LibraryCategoryDefinition]) => {

            if (!category.description) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'description', categoryName];
            if (!category.fields) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'fields', categoryName];
            assertFieldsAreValid(category.fields, VALID_LIBRARY_FIELD_PROPERTIES, 'library');

            if (!builtInCategoryNames.includes(categoryName) && !category.parent) {
                throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'parent', categoryName];
            }
        }
    }
}
