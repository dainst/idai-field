import { cond, isEmpty, flow, includedIn, isNot, on,
    isDefined, filter, and, Map, remove, keysValues, forEach, map, values, not } from 'tsfun';
import { BaseFieldDefinition } from './base-field-definition';
import { CustomFieldDefinition } from './custom-field-definition';
import { LibraryFieldDefinition } from './library-field-definition';
import { ConfigurationErrors } from '../../boot/configuration-errors';


const VALID_INPUT_TYPES = [
    'input', 'simpleInput', 'multiInput', 'simpleMultiInput', 'text', 'dropdown', 'dropdownRange', 'radio',
    'checkboxes', 'int', 'unsignedInt', 'float', 'unsignedFloat', 'dating', 'dimension', 'literature', 'boolean',
    'date', 'url', 'complex'
];


export function assertFieldsAreValid(fields: Map<LibraryFieldDefinition>|Map<CustomFieldDefinition>,
                                     validFieldKeys: string[], source: 'custom'|'library') {

    assertInputTypesAreValid(fields);
    assertFieldKeysAreValid(fields, validFieldKeys, source);
}


function assertInputTypesAreValid(fields: Map<LibraryFieldDefinition>|Map<CustomFieldDefinition>) {

    const isIllegal = and(
                isDefined,
                isNot(includedIn(VALID_INPUT_TYPES))
    );

    flow(
        keysValues(fields),
        filter(on([1, BaseFieldDefinition.INPUTTYPE], isIllegal)),
        forEach(([fieldName, field]: any) => {
            throw [ConfigurationErrors.ILLEGAL_FIELD_INPUT_TYPE, field.inputType, fieldName];
        })
    );
}


function assertFieldKeysAreValid(fields: Map<LibraryFieldDefinition>|Map<CustomFieldDefinition>,
                                 validFieldKeys: string[], source: 'custom'|'library') {

    function throwIllegalFieldProperty(keys: string) {

        throw [ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, source, keys[0]];
    }

    const throwIllegalFieldPropertyIfNotEmpty = cond(not(isEmpty), throwIllegalFieldProperty);

    flow(
        fields,
        map(Object.keys),
        map(remove(includedIn(validFieldKeys))),
        values,
        forEach(throwIllegalFieldPropertyIfNotEmpty)
    );
}
