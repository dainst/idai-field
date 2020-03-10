import {clone, compose, filter, flow, forEach, includedIn, isDefined, isNot, isnt, keys,
    keysAndValues, lookup, map, Map, on, pairWith, reduce, subtract, to, union, update} from 'tsfun';
import {LibraryTypeDefinition} from '../model/library-type-definition';
import {CustomFieldDefinition, CustomTypeDefinition} from '../model/custom-type-definition';
import {ConfigurationErrors} from './configuration-errors';
import {FieldDefinition} from '../model/field-definition';
import {ValuelistDefinitions} from '../model/valuelist-definition';
import {withDissoc} from '../../util/utils';
import {TransientFieldDefinition, TransientTypeDefinition} from '../model/transient-type-definition';
import {BuiltinTypeDefinition} from '../model/builtin-type-definition';
import {mergeBuiltInWithLibraryTypes} from './merge-builtin-with-library-types.spec';
import {mergeFields} from './merge-fields';
import {Assertions} from './assertions';
import {getDefinedParents, iterateOverFieldsOfTypes} from './helpers';


const VALUELISTS = 'valuelists';
const COMMONS = 'commons';

type CommonFields = {[fieldName: string]: any};


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 *
 * Does
 * - merge the builtin, library and custom types
 * - replace common fields
 *
 * Does not
 * - mix in parent type
 * - mix in language, order, search
 *
 * @param builtInTypes
 * @param libraryTypes
 * @param customTypes
 * @param commonFields
 * @param valuelistsConfiguration
 * @param extraFields
 *
 * @see ConfigurationErrors
 * @throws [DUPLICATION_IN_SELECTION, typeFamilyName]
 * @throws [MUST_HAVE_PARENT, typeName]
 * @throws [MISSING_TYPE_PROPERTY, propertyName, typeName]
 * @throws [MISSING_VALUELIST_PROPERTY, propertyName, valuelistId]
 * @throws [MISSING_FIELD_PROPERTY, propertyName, typeName, fieldName]
 * @throws [MUST_NOT_SET_INPUT_TYPE, typeName, fieldName]
 * @throws [ILLEGAL_FIELD_TYPE, fieldType, fieldName]
 * @throws [TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_TYPE, superTypeName]
 * @throws [ILLEGAL_FIELD_PROPERTIES, [properties]]
 * @throws [ILLEGAL_FIELD_PROPERTY, 'library'|'custom', property]
 * @throws [INCONSISTENT_TYPE_FAMILY, typeFamilyName, reason (, fieldName)]
 * @throws [COMMON_FIELD_NOT_PROVIDED, commonFieldName]
 */
export function buildProjectTypes(builtInTypes: Map<BuiltinTypeDefinition>,
                                  libraryTypes: Map<LibraryTypeDefinition>,
                                  customTypes: Map<CustomTypeDefinition> = {},
                                  commonFields: CommonFields = {},
                                  valuelistsConfiguration: ValuelistDefinitions = {},
                                  extraFields: { [extraFieldName: string]: any } = {}) {

    const assertInputTypePresentIfNotCommonType_ = assertInputTypePresentIfNotCommonType(commonFields);
    Assertions.performAssertions(builtInTypes, libraryTypes, customTypes, commonFields, valuelistsConfiguration);

    addSourceField(builtInTypes, libraryTypes, customTypes, commonFields);
    const selectableTypes: Map<TransientTypeDefinition> = mergeBuiltInWithLibraryTypes(builtInTypes, libraryTypes);
    Assertions.assertInputTypesAreSet(selectableTypes, assertInputTypePresentIfNotCommonType_);
    Assertions.assertNoDuplicationInSelection(selectableTypes, customTypes);

    const mergedTypes: Map<TransientTypeDefinition> =
        mergeTypes(
            selectableTypes,
            customTypes as any,
            assertInputTypePresentIfNotCommonType_);

    const selectedTypes: Map<TransientTypeDefinition> =  eraseUnusedTypes(mergedTypes, Object.keys(customTypes));
    replaceCommonFields(selectedTypes, commonFields);

    insertValuelistIds(selectedTypes);
    Assertions.assertValuelistIdsProvided(selectedTypes);
    hideFields(selectedTypes, customTypes);

    return flow(
        selectedTypes,
        toTypesByFamilyNames,
        applyValuelistsConfiguration(valuelistsConfiguration as any),
        addExtraFields(extraFields));
}


function insertValuelistIds(mergedTypes: Map<TransientTypeDefinition>) {

    iterateOverFieldsOfTypes(mergedTypes, (typeName, type, fieldName, field) => {

        if (type.valuelists && type.valuelists[fieldName]) {
            field.valuelistId = type.valuelists[fieldName];
        }
    });
}


function addSourceField(builtInTypes: Map<BuiltinTypeDefinition>,
                        libraryTypes: Map<LibraryTypeDefinition>,
                        customTypes: Map<CustomTypeDefinition>,
                        commonFields: CommonFields) {

    setFieldSourceOnTypes(builtInTypes, FieldDefinition.Source.BUILTIN);
    setFieldSourceOnTypes(libraryTypes, FieldDefinition.Source.LIBRARY);
    setFieldSourceOnTypes(customTypes, FieldDefinition.Source.CUSTOM);
    setFieldSourceOnFields(commonFields, FieldDefinition.Source.COMMON);
}


function setFieldSourceOnTypes(types: any, value: any) {

    forEach((type: TransientTypeDefinition) => setFieldSourceOnFields(type.fields, value))(types);
}


function setFieldSourceOnFields(fields: any, value: any) {

    forEach((field: TransientFieldDefinition) => field.source = value)(fields);
}


function addExtraFields(extraFields: {[fieldName: string]: FieldDefinition }) {

    return (configuration: Map<TransientTypeDefinition>) => {

        const configuration_ = clone(configuration);

        for (let typeName of Object.keys(configuration_)) {
            const typeDefinition = configuration_[typeName];

            if (!typeDefinition.fields) typeDefinition.fields = {};

            if (typeDefinition.parent == undefined) {
                _addExtraFields(typeDefinition, extraFields)
            }

            for (let fieldName of Object.keys(typeDefinition.fields)) {
                const fieldDefinition = typeDefinition.fields[fieldName];

                if (fieldDefinition.editable == undefined) fieldDefinition.editable = true;
                if (fieldDefinition.visible == undefined) fieldDefinition.visible = true;
            }
        }

        return configuration_;
    };
}


function _addExtraFields(typeDefinition: TransientTypeDefinition,
                         extraFields: {[fieldName: string]: FieldDefinition }) {

    for (let extraFieldName of Object.keys(extraFields)) {
        let fieldAlreadyPresent = false;

        for (let fieldName of Object.keys(typeDefinition.fields)) {
            if (fieldName === extraFieldName) fieldAlreadyPresent = true;
        }

        if (!fieldAlreadyPresent) {
            typeDefinition.fields[extraFieldName] = Object.assign({}, extraFields[extraFieldName]);
        }
    }
}


function applyValuelistsConfiguration(valuelistsConfiguration: {[id: string]: {values: string[]}}) {

    return (types: Map<TransientTypeDefinition>) => {

        const types_ = clone(types);

        const processFields = compose(
            filter(on('valuelistId', isDefined)),
            forEach((fd: TransientFieldDefinition) => fd.valuelist
                = Object.keys(valuelistsConfiguration[fd.valuelistId as string].values)));

        flow(types_,
            filter(isDefined),
            map(to('fields')),
            forEach(processFields));

        return types_;
    }
}


function toTypesByFamilyNames(transientTypes: Map<TransientTypeDefinition>): Map<TransientTypeDefinition> {

    return reduce(
        (acc: any, [transientTypeName, transientType]) => {
            acc[transientType.typeFamily
                ? transientType.typeFamily
                : transientTypeName] = transientType;
            return acc;
        }
        , {})(keysAndValues(transientTypes));
}


function hideFields(mergedTypes: any, selectedTypes: any) {

    keysAndValues(mergedTypes).forEach(([builtInTypeName, builtInType]) => {

        keysAndValues(selectedTypes).forEach(([selectedTypeName, selectedType]) => {
            if (selectedTypeName === builtInTypeName) {

                if ((builtInType as any)['fields']) Object.keys((builtInType as any)['fields']).forEach(fn => {
                    if ((selectedType as any)['hidden'] && (selectedType as any)['hidden'].includes(fn)) {
                        (builtInType as any)['fields'][fn].visible = false;
                        (builtInType as any)['fields'][fn].editable = false;
                    }
                })
            }
        })
    });
}


function eraseUnusedTypes(types: Map<TransientTypeDefinition>,
                          selectedTypeNames: string[]): Map<TransientTypeDefinition> {

    const keysOfNotSelectedTypes = Object.keys(types).filter(isNot(includedIn(selectedTypeNames)));
    const parentNamesOfSelectedTypes: string[] =
        flow(
            keysOfNotSelectedTypes,
            reduce(withDissoc, types),
            getDefinedParents);

    const typesToErase = subtract(parentNamesOfSelectedTypes)(keysOfNotSelectedTypes);
    return typesToErase.reduce(withDissoc, types) as Map<TransientTypeDefinition>;
}





function replaceCommonFields(mergedTypes: Map<TransientTypeDefinition>, commonFields: CommonFields) {

    for (let mergedType of Object.values(mergedTypes)) {

        if (!mergedType.commons) continue;

        for (let commonFieldName of mergedType.commons) {
            if (!commonFields[commonFieldName]) {
                throw [ConfigurationErrors.COMMON_FIELD_NOT_PROVIDED, commonFieldName];
            }

            if (!mergedType.fields[commonFieldName]) mergedType.fields[commonFieldName] = {};
            mergedType.fields[commonFieldName].source = commonFields[commonFieldName].source;
            mergedType.fields[commonFieldName].inputType = commonFields[commonFieldName].inputType;
            mergedType.fields[commonFieldName].group = commonFields[commonFieldName].group;
            mergedType.fields[commonFieldName].valuelistFromProjectField
                = commonFields[commonFieldName].valuelistFromProjectField;
            mergedType.fields[commonFieldName].allowOnlyValuesOfParent
                = commonFields[commonFieldName].allowOnlyValuesOfParent;
        }
        delete mergedType.commons;
    }
}


/**
 * excluding fields
 *
 * @param target
 * @param source
 */
function mergePropertiesOfType(target: {[_: string]: any}, source: {[_: string]: any}) {

    if (source[COMMONS]) {
        target[COMMONS] = union([target[COMMONS] ? target[COMMONS] : [], source[COMMONS]]);
    }

    if (source[VALUELISTS]) {
        if (!target[VALUELISTS]) target[VALUELISTS] = {};
        keysAndValues(source[VALUELISTS]).forEach(([k, v]: any) => {
            target[VALUELISTS][k] = v;
        });
    }

    Object.keys(source)
        .filter(isnt('fields'))
        .filter(isNot(includedIn(keys(target))))
        .map(pairWith(lookup(source)))
        .forEach(overwriteIn(target));
}


function overwriteIn(target: {[_: string]: any}) {

    return ([key, value]: [string, any]) => target[key] = value;
}


function isAllowedCombination(l: string, r: string, a: string, b: string) {

    return (l === a && r === b) || (l === b && r === a);
}


function checkFieldTypeChange(
    [customTypeName, fieldName, customFieldInputType, extendedFieldInputType]: [string, string, string, string]) {

    if (customFieldInputType === extendedFieldInputType) return;

    if (isAllowedCombination(customFieldInputType, extendedFieldInputType, 'checkboxes', 'input')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'input')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'checkboxes', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'input', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'radio')
        || isAllowedCombination(customFieldInputType, extendedFieldInputType, 'dropdown', 'checkboxes')) {

        console.warn('change of input type detected', customTypeName, fieldName, customFieldInputType, extendedFieldInputType);
    } else {
        console.error('critical change of input type detected', customTypeName, fieldName, customFieldInputType, extendedFieldInputType);
    }
}


function checkFieldTypeChanges(customTypeName: string,
                               customTypeFields: Map<CustomFieldDefinition>,
                               extendedTypeFields: Map<TransientFieldDefinition>) {

    flow(customTypeFields,
        map((field: CustomFieldDefinition, fieldName: string) =>
            [customTypeName, fieldName, field, lookup(extendedTypeFields)(fieldName)]),
        filter(on('[2].inputType', isDefined)),
        filter(on('[3].inputType', isDefined)),
        map(update(2, to('inputType'))),
        map(update(3, to('inputType'))),
        forEach(checkFieldTypeChange));
}


function mergeTypes(selectableTypes: Map<TransientTypeDefinition>,
                    customTypes: Map<CustomTypeDefinition>,
                    assertInputTypePresentIfNotCommonType: Function) {

    const mergedTypes: Map<TransientTypeDefinition> = clone(selectableTypes);

    const pairs = keysAndValues(customTypes);

    forEach(([customTypeName, customType]: any) => {

        const extendedType = mergedTypes[customTypeName];

        if (extendedType) {
            checkFieldTypeChanges(customTypeName, customType.fields, extendedType.fields);

            const newMergedType: any = clone(extendedType);
            mergePropertiesOfType(newMergedType, customType);
            mergeFields(newMergedType.fields, customType.fields);

            mergedTypes[customTypeName] = newMergedType;
        } else {
            if (!customType.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, customTypeName];

            keysAndValues(customType.fields).forEach(([fieldName, field]: any) => {
                assertInputTypePresentIfNotCommonType(customTypeName, fieldName, field);
            });

            mergedTypes[customTypeName] = customType;
        }
    })(pairs);

    return mergedTypes;
}


function assertInputTypePresentIfNotCommonType(commonFields: any) {

    return (typeName: string, fieldName: string, field: any) => {

        if (!field.inputType && !Object.keys(commonFields).includes(fieldName)) {
            throw [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', typeName, fieldName];
        }
    }
}
