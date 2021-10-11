import { includedIn, isNot, Map, throws } from 'tsfun';
import { Name } from '../../../tools';
import { assertFieldsAreValid } from '../field/assert-fields-are-valid';
import { ConfigurationErrors } from '../../boot/configuration-errors';
import { BaseFormDefinition } from './base-form-definition';
import { CustomFieldDefinition, VALID_CUSTOM_FIELD_PROPERTIES } from '../field/custom-field-definition';
import { Valuelists } from '../../../model/configuration/valuelist';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface CustomFormDefinition extends BaseFormDefinition {

    hidden?: string[];
    parent?: string;
    fields: Map<CustomFieldDefinition>;
    positionValuelists?: Valuelists;
}


const VALID_CUSTOM_FORM_PROPERTIES = [
    'valuelists', 'positionValuelists', 'color', 'hidden', 'parent', 'fields', 'groups'
];


export module CustomFormDefinition {

    export const VALUELISTS = 'valuelists';
    export const PARENT = 'parent';

    export function makeAssertIsValid(formNames: string[]) {

        return function assertIsValid([formName, form]: [Name, CustomFormDefinition]) {

            Object.keys(form)
                .filter(isNot(includedIn(VALID_CUSTOM_FORM_PROPERTIES)))
                .map(fieldName => [ConfigurationErrors.ILLEGAL_CUSTOM_FORM_PROPERTY, fieldName, formName])
                .forEach(throws());

            if (!formNames.includes(formName)) {
                if (!form.parent) {
                    throw [
                        ConfigurationErrors.MISSING_FORM_PROPERTY,
                        CustomFormDefinition.PARENT,
                        formName,
                        'must be set for new categories'
                    ];
                }
            } else {
                if (form.parent) {
                    throw [
                        ConfigurationErrors.ILLEGAL_CUSTOM_FORM_PROPERTY,
                        CustomFormDefinition.PARENT,
                        formName,
                        'must not be set if not a new category'
                    ];
                }
            }

            assertFieldsAreValid(form.fields, VALID_CUSTOM_FIELD_PROPERTIES, 'custom');
        }
    }
}
