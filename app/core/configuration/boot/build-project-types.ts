import {BuiltinFieldDefinition, BuiltinTypeDefinitions} from '../model/builtin-type-definition';
import {LibraryFieldDefinition, LibraryTypeDefinition, LibraryTypeDefinitionsMap} from '../model/library-type-definition';
import {CustomFieldDefinition, CustomFieldDefinitionsMap, CustomTypeDefinition, CustomTypeDefinitionsMap} from '../model/custom-type-definition';
import {clone, compose, filter, flow, forEach, includedIn, is, isDefined, isNot, isnt, update,
    jsonClone, keysAndValues, map, on, reduce, subtract, to, union, keys, lookup, pairWith} from 'tsfun';
import {ConfigurationErrors} from './configuration-errors';
import {FieldDefinition} from '../model/field-definition';
import {ValuelistDefinition, ValuelistDefinitions} from '../model/valuelist-definition';
import {withDissoc} from '../../util/utils';


const VALUELISTS = 'valuelists';
const COMMONS = 'commons';

type CommonFields = {[fieldName: string]: any};


interface TransientTypeDefinition extends BuiltinFieldDefinition, LibraryTypeDefinition {

    fields: TransientFieldDefinitionsMap;
}


interface TransientFieldDefinition extends BuiltinFieldDefinition, LibraryFieldDefinition {

    valuelist?: any;
    valuelistId?: string,
    valuelistFromProjectField?: string;
    visible?: boolean;
    editable?: boolean;
}

type TransientTypeDefinitionsMap = { [typeName: string]: TransientTypeDefinition };

type TransientFieldDefinitionsMap = { [fieldName: string]: TransientFieldDefinition };


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
export function buildProjectTypes(builtInTypes: BuiltinTypeDefinitions,
                                  libraryTypes: LibraryTypeDefinitionsMap,
                                  customTypes: CustomTypeDefinitionsMap = {},
                                  commonFields: CommonFields = {},
                                  valuelistsConfiguration: ValuelistDefinitions = {},
                                  extraFields: { [extraFieldName: string]: any } = {}) {

    const assertInputTypePresentIfNotCommonType_ = assertInputTypePresentIfNotCommonType(commonFields);

    assertTypesAndValuelistsStructurallyValid(Object.keys(builtInTypes), libraryTypes, customTypes, valuelistsConfiguration);
    assertSubtypingIsLegal(builtInTypes, libraryTypes);
    assertSubtypingIsLegal(builtInTypes, customTypes);
    assertNoCommonFieldInputTypeChanges(commonFields, libraryTypes);
    assertNoCommonFieldInputTypeChanges(commonFields, customTypes);
    assertTypeFamiliesConsistent(libraryTypes);

    const selectableTypes: TransientTypeDefinitionsMap = mergeBuiltInWithLibraryTypes(builtInTypes, libraryTypes);
    assertInputTypesAreSet(selectableTypes, assertInputTypePresentIfNotCommonType_);
    assertNoDuplicationInSelection(selectableTypes, customTypes);

    const mergedTypes: TransientTypeDefinitionsMap =
        mergeTypes(
            selectableTypes,
            customTypes as any,
            assertInputTypePresentIfNotCommonType_);

    const selectedTypes: TransientTypeDefinitionsMap =  eraseUnusedTypes(mergedTypes, Object.keys(customTypes));
    replaceCommonFields(selectedTypes, commonFields);

    insertValuelistIds(selectedTypes);
    assertValuelistIdsProvided(selectedTypes);
    hideFields(selectedTypes, customTypes);

    return flow(
        selectedTypes,
        toTypesByFamilyNames,
        applyValuelistsConfiguration(valuelistsConfiguration as any),
        addExtraFields(extraFields));
}


function insertValuelistIds(mergedTypes: TransientTypeDefinitionsMap) {

    iterateOverFieldsOfTypes(mergedTypes, (typeName, type, fieldName, field) => {

        if (type.valuelists && type.valuelists[fieldName]) {
            field.valuelistId = type.valuelists[fieldName];
        }
    });
}


function assertValuelistIdsProvided(mergedTypes: TransientTypeDefinitionsMap) {

    iterateOverFieldsOfTypes(mergedTypes, (typeName, type, fieldName, field) => {
        if (['dropdown', 'checkboxes', 'radio'].includes(field.inputType ? field.inputType : '')) {

            if (!field.valuelistId && !field.valuelistFromProjectField) {
                throw [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'valuelistId', typeName, fieldName];
            }
        }
    });
}


function assertNoDuplicationInSelection(mergedTypes: TransientTypeDefinitionsMap,
                                        customTypes: CustomTypeDefinitionsMap) {

    Object.keys(customTypes).reduce((selectedTypeFamilies, customTypeName) => {

        const selectedType = mergedTypes[customTypeName];
        if (!selectedType) return selectedTypeFamilies;
        if (!selectedTypeFamilies.includes(selectedType.typeFamily)) {
            return selectedTypeFamilies.concat([selectedType.typeFamily]);
        }
        throw [ConfigurationErrors.DUPLICATION_IN_SELECTION, selectedType.typeFamily];

    }, [] as string[]);
}


function assertTypeFamiliesConsistent(libraryTypes: LibraryTypeDefinitionsMap) {

    type InputType = string;
    const collected: { [typeFamilyName: string]: { [fieldName: string]: InputType }} = {};

    Object.values(libraryTypes).forEach((libraryType: any) => {

        const typeFamily = libraryType.typeFamily;

        if (!collected[typeFamily]) collected[typeFamily] = {};

        keysAndValues(libraryType.fields).forEach(([fieldName, field]: any) => {

            const inputType = field['inputType'];

            if (collected[typeFamily][fieldName]) {
                if (collected[typeFamily][fieldName] !== inputType) {
                    throw [
                        ConfigurationErrors.INCONSISTENT_TYPE_FAMILY,
                        typeFamily,
                        'divergentInputType',
                        fieldName];
                }
            } else {
                collected[typeFamily][fieldName] = inputType;
            }
        });
    });
}


/**
 * Currently we check for every field of the library types, if
 * for a field having the name of a common field, the input type differs from
 * that one defined in the common field, regardless of whether the type actually
 * uses that common field or not
 *
 * @param commonFields
 * @param types
 */
function assertNoCommonFieldInputTypeChanges(commonFields: CommonFields,
                                             types: LibraryTypeDefinitionsMap|CustomTypeDefinitionsMap) {

    const commonFieldNames = Object.keys(commonFields);

    iterateOverFieldsOfTypes(types as any, (typeName, type, fieldName, field) => {

        if (commonFieldNames.includes(fieldName)) {
            if (field.inputType) {
                throw [ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, typeName, fieldName];
            }
        }
    });
}


function assertInputTypesAreSet(types: TransientTypeDefinitionsMap,
                                assertInputTypePresentIfNotCommonType: Function) {

    iterateOverFieldsOfTypes(types, (typeName, type, fieldName, field) => {
        assertInputTypePresentIfNotCommonType(typeName, fieldName, field);
    });
}


function iterateOverFieldsOfTypes(types: TransientTypeDefinitionsMap,
                                  f: (typeName: string, type: TransientTypeDefinition,
                                      fieldName: string, field: TransientFieldDefinition) => void) {

    keysAndValues(types).forEach(([typeName, type]) => {
        keysAndValues((type as any).fields).forEach(([fieldName, field]: any) => {
            f(typeName, type as any, fieldName, field);
        })
    });
}


function addExtraFields(extraFields: {[fieldName: string]: FieldDefinition }) {

    return (configuration: TransientTypeDefinitionsMap) => {

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

    return (types: TransientTypeDefinitionsMap) => {

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


function toTypesByFamilyNames(transientTypes: TransientTypeDefinitionsMap): TransientTypeDefinitionsMap {

    return reduce(
        (acc: any, [transientTypeName, transientType]) => {
            acc[transientType.typeFamily
                ? transientType.typeFamily
                : transientTypeName] = transientType;
            return acc;
        }
        , {})(keysAndValues(transientTypes));
}


function assertTypesAndValuelistsStructurallyValid(builtInTypes: string[],
                                                   libraryTypes: LibraryTypeDefinitionsMap,
                                                   customTypes: CustomTypeDefinitionsMap,
                                                   valuelistDefinitions: ValuelistDefinitions) {

    const assertLibraryTypeValid = LibraryTypeDefinition.makeAssertIsValid(builtInTypes);
    const assertCustomTypeValid = CustomTypeDefinition.makeAssertIsValid(builtInTypes, Object.keys(libraryTypes));

    keysAndValues(libraryTypes).forEach(assertLibraryTypeValid);
    keysAndValues(customTypes).forEach(assertCustomTypeValid);
    keysAndValues(valuelistDefinitions).forEach(ValuelistDefinition.assertIsValid);
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


const getDefinedParents =
    compose(
        Object.values,
        map(to('parent')),
        filter(isDefined));


function eraseUnusedTypes(types: TransientTypeDefinitionsMap,
                          selectedTypeNames: string[]): TransientTypeDefinitionsMap {

    const keysOfNotSelectedTypes = Object.keys(types).filter(isNot(includedIn(selectedTypeNames)));
    const parentNamesOfSelectedTypes =
        flow(
            keysOfNotSelectedTypes,
            reduce(withDissoc, types),
            getDefinedParents);

    const typesToErase = subtract(parentNamesOfSelectedTypes)(keysOfNotSelectedTypes);
    return typesToErase.reduce(withDissoc, types) as TransientTypeDefinitionsMap;
}


function assertSubtypingIsLegal(builtinTypes: BuiltinTypeDefinitions, types: any) {

    flow(types,
        getDefinedParents,
        forEach((parent: any) => {
            const found = Object.keys(builtinTypes).find(is(parent));
            if (!found) throw [ConfigurationErrors.INVALID_CONFIG_PARENT_NOT_DEFINED, parent];
            const foundBuiltIn = builtinTypes[found];
            if (!foundBuiltIn.superType || !foundBuiltIn.userDefinedSubtypesAllowed) {
                throw [ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_TYPE, parent];
            }
        }));
}


function replaceCommonFields(mergedTypes: TransientTypeDefinitionsMap, commonFields: CommonFields) {

    for (let mergedType of Object.values(mergedTypes)) {

        if (!mergedType.commons) continue;

        for (let commonFieldName of mergedType.commons) {
            if (!commonFields[commonFieldName]) {
                throw [ConfigurationErrors.COMMON_FIELD_NOT_PROVIDED, commonFieldName];
            }

            if (!mergedType.fields[commonFieldName]) mergedType.fields[commonFieldName] = {};
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


function merge(target: any, source: any) {

    for (let sourceFieldName of Object.keys(source)) {
        if (sourceFieldName === 'fields') continue;
        let alreadyPresentInTarget = false;
        for (let targetFieldName of Object.keys(target)) {
            if (targetFieldName === sourceFieldName) alreadyPresentInTarget = true;
        }
        if (!alreadyPresentInTarget) target[sourceFieldName] = source[sourceFieldName];
    }
}


function mergeFields(target: TransientFieldDefinitionsMap,
                     source: TransientFieldDefinitionsMap) {

    for (let sourceFieldName of Object.keys(source)) {
        let alreadyPresentInTarget = false;
        for (let targetFieldName of Object.keys(target)) {
            if (targetFieldName === sourceFieldName) alreadyPresentInTarget = true;
        }
        if (!alreadyPresentInTarget) {
            target[sourceFieldName] = source[sourceFieldName];
        } else {
            // at the moment, this is allowed for custom type fields, see also issueWarningOnFieldTypeChanges
            if (source[sourceFieldName].inputType) {
                target[sourceFieldName].inputType = source[sourceFieldName].inputType;
            }
            if (source[sourceFieldName].valuelistId) {
                target[sourceFieldName].valuelistId = source[sourceFieldName].valuelistId;
            }
            if (source[sourceFieldName].valuelistFromProjectField) {
                target[sourceFieldName].valuelistFromProjectField
                    = source[sourceFieldName].valuelistFromProjectField;
            }
        }
    }
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
                               customTypeFields: CustomFieldDefinitionsMap,
                               extendedTypeFields: TransientFieldDefinitionsMap) {

    flow(customTypeFields,
        map((field: CustomFieldDefinition, fieldName: string) =>
            [customTypeName, fieldName, field, lookup(extendedTypeFields)(fieldName)]),
        filter(on('[2].inputType', isDefined)),
        filter(on('[3].inputType', isDefined)),
        map(update(2, to('inputType'))),
        map(update(3, to('inputType'))),
        forEach(checkFieldTypeChange));
}


function mergeBuiltInWithLibraryTypes(builtInTypes: BuiltinTypeDefinitions,
                                      libraryTypes: LibraryTypeDefinitionsMap): TransientTypeDefinitionsMap {

    const types: TransientTypeDefinitionsMap = clone(builtInTypes) as unknown as TransientTypeDefinitionsMap;
    keysAndValues(types).forEach(([typeName, type]) => (type as any).typeFamily = typeName);

    keysAndValues(libraryTypes).forEach(([libraryTypeName, libraryType]: any) => {

        const extendedBuiltInType = builtInTypes[libraryType.typeFamily];
        if (extendedBuiltInType) {

            const newMergedType: any = jsonClone(extendedBuiltInType);
            merge(newMergedType, libraryType);
            keysAndValues(libraryType.fields).forEach(([libraryTypeFieldName, libraryTypeField]) => {
                if (extendedBuiltInType.fields[libraryTypeFieldName] && (libraryTypeField as any)['inputType']) {
                    throw [ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, libraryTypeName, libraryTypeFieldName];
                }
            });
            mergeFields(newMergedType.fields, libraryType.fields);
            types[libraryTypeName] = newMergedType;
        } else {

            if (!libraryType.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, libraryTypeName];
            types[libraryTypeName] = libraryType;
        }
    });

    return types;
}


function mergeTypes(selectableTypes: TransientTypeDefinitionsMap,
                    customTypes: CustomTypeDefinitionsMap,
                    assertInputTypePresentIfNotCommonType: Function) {

    const mergedTypes: TransientTypeDefinitionsMap = clone(selectableTypes);

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
