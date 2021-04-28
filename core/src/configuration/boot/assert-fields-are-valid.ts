import {cond, empty, flow, includedIn, isNot, on,
    isDefined, filter, and, Map, remove, keysValues, forEach, map, values} from 'tsfun';
import {ConfigurationErrors} from './configuration-errors';
import {LibraryFieldDefinition} from '../model/library-category-definition';
import {CustomFieldDefinition} from '../model/custom-category-definition';
import {BaseFieldDefinition} from '../model/base-category-definition';


const VALID_INPUT_TYPES = [
    'input', 'multiInput', 'text', 'dropdown', 'dropdownRange', 'radio', 'checkboxes', 'unsignedInt', 'float',
    'unsignedFloat', 'dating', 'dimension', 'literature', 'boolean', 'date'
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

        throw [ConfigurationErrors.ILLEGAL_FIELD_PROPERTY, source, keys[0]]
    }

    const throwIllegalFieldPropertyIfNotEmpty = cond(isNot(empty), throwIllegalFieldProperty);

    flow(
        fields,
        map(Object.keys),
        map(remove(includedIn(validFieldKeys))),
        values,
        forEach(throwIllegalFieldPropertyIfNotEmpty)
    );
}
