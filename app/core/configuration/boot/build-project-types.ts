import {clone, compose, filter, flow, forEach, includedIn, isDefined, isNot, isnt, keys,
    keysAndValues, lookup, map, Map, on, pairWith, Pair, reduce, subtract, to, union, update} from 'tsfun';
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
 */
export function buildProjectTypes(builtInTypes: Map<BuiltinTypeDefinition>,
                                  libraryTypes: Map<LibraryTypeDefinition>,
                                  customTypes: Map<CustomTypeDefinition> = {},
                                  commonFields: CommonFields = {},
                                  valuelistsConfiguration: ValuelistDefinitions = {},
                                  extraFields: { [extraFieldName: string]: any } = {}) {

    Assertions.performAssertions(builtInTypes, libraryTypes, customTypes, commonFields, valuelistsConfiguration);
    addSourceField(builtInTypes, libraryTypes, customTypes, commonFields);

    return flow(
        mergeBuiltInWithLibraryTypes(builtInTypes, libraryTypes),
        Assertions.assertInputTypesAreSet(assertInputTypePresentIfNotCommonType(commonFields)),
        Assertions.assertNoDuplicationInSelection(customTypes),
        mergeTypes(customTypes, assertInputTypePresentIfNotCommonType(commonFields)),
        eraseUnusedTypes(keys(customTypes)),
        replaceCommonFields(commonFields),
        insertValuelistIds,
        Assertions.assertValuelistIdsProvided,
        hideFields(customTypes),
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

    return mergedTypes;
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


function addExtraFields(extraFields: Map<FieldDefinition>) {

    return (configuration: Map<TransientTypeDefinition>) => {

        return reduce((configuration: Map<TransientTypeDefinition>, typeName: string) => {

            return update(typeName, addExtraFieldsToType(extraFields))(configuration);

        }, configuration)(keys(configuration));
    };
}


function addExtraFieldsToType(extraFields: Map<FieldDefinition>) {

    return (typeDefinition: TransientTypeDefinition) => {

        const newTypeDefinition = clone(typeDefinition);
        if (!newTypeDefinition.fields) newTypeDefinition.fields = {};
        if (newTypeDefinition.parent === undefined) _addExtraFields(newTypeDefinition, extraFields);
        return newTypeDefinition
    }
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


function hideFields(customTypes: Map<CustomTypeDefinition>) {

    return (selectedTypes_: Map<TransientTypeDefinition>) => {

        const selectedTypes = clone(selectedTypes_);

        keysAndValues(selectedTypes).forEach(
            ([selectedTypeName, selectedType]: Pair<string, TransientTypeDefinition>) => {

                keysAndValues(customTypes).forEach(
                    ([customTypeName, customType]: Pair<string, CustomTypeDefinition>) => {

                        if (customTypeName === selectedTypeName && selectedType.fields) {

                            Object.keys(selectedType.fields).forEach(fieldName => {
                                if (customType.hidden && customType.hidden.includes(fieldName)) {
                                    selectedType.fields[fieldName].visible = false;
                                    selectedType.fields[fieldName].editable = false;
                                }

                                if (selectedType.fields[fieldName].visible === undefined) selectedType.fields[fieldName].visible = true;
                                if (selectedType.fields[fieldName].editable === undefined) selectedType.fields[fieldName].editable = true;
                            })
                        }
                    })
        });

        return selectedTypes;
    }
}


function eraseUnusedTypes(selectedTypeNames: string[]) {

    return (types: Map<TransientTypeDefinition>): Map<TransientTypeDefinition> => {

        const keysOfNotSelectedTypes = Object.keys(types).filter(isNot(includedIn(selectedTypeNames)));
        const parentNamesOfSelectedTypes: string[] =
            flow(
                keysOfNotSelectedTypes,
                reduce(withDissoc, types),
                getDefinedParents);

        const typesToErase = subtract(parentNamesOfSelectedTypes)(keysOfNotSelectedTypes);
        return typesToErase.reduce(withDissoc, types) as Map<TransientTypeDefinition>;
    }
}


function replaceCommonFields(commonFields: CommonFields) {

    return (mergedTypes: Map<TransientTypeDefinition>) => {

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

        return mergedTypes;
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


function mergeTypes(customTypes: Map<CustomTypeDefinition>,
                    assertInputTypePresentIfNotCommonType: Function) {

    return (selectableTypes: Map<TransientTypeDefinition>) => {

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
}


function assertInputTypePresentIfNotCommonType(commonFields: any) {

    return (typeName: string, fieldName: string, field: any) => {

        if (!field.inputType && !Object.keys(commonFields).includes(fieldName)) {
            throw [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', typeName, fieldName];
        }
    }
}
