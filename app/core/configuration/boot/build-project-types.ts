import {assoc, clone, cond, dissoc, flow, includedIn, isDefined, isNot, keys, keysAndValues, map,
    Map, on, Pair, reduce, subtract, undefinedOrEmpty, update} from 'tsfun';
import {LibraryTypeDefinition} from '../model/library-type-definition';
import {CustomTypeDefinition} from '../model/custom-type-definition';
import {ConfigurationErrors} from './configuration-errors';
import {ValuelistDefinition} from '../model/valuelist-definition';
import {withDissoc} from '../../util/utils';
import {TransientFieldDefinition, TransientTypeDefinition} from '../model/transient-type-definition';
import {BuiltinTypeDefinition} from '../model/builtin-type-definition';
import {mergeBuiltInWithLibraryTypes} from './merge-builtin-with-library-types.spec';
import {Assertions} from './assertions';
import {getDefinedParents, iterateOverFieldsOfTypes} from './helpers';
import {addSourceField} from './add-source-field';
import {mergeTypes} from './merge-types';
import {addExtraFields} from './add-extra-fields';


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
                                  commonFields: Map<any> = {},
                                  valuelistsConfiguration: Map<ValuelistDefinition> = {},
                                  extraFields: Map<any> = {}) {

    Assertions.performAssertions(builtInTypes, libraryTypes, customTypes, commonFields, valuelistsConfiguration);
    addSourceField(builtInTypes, libraryTypes, customTypes, commonFields);

    return flow(
        mergeBuiltInWithLibraryTypes(builtInTypes, libraryTypes),
        Assertions.assertInputTypesAreSet(Assertions.assertInputTypePresentIfNotCommonType(commonFields)),
        Assertions.assertNoDuplicationInSelection(customTypes),
        mergeTypes(customTypes, Assertions.assertInputTypePresentIfNotCommonType(commonFields)),
        eraseUnusedTypes(keys(customTypes)),
        replaceCommonFields(commonFields),
        insertValuelistIds,
        Assertions.assertValuelistIdsProvided,
        hideFields(customTypes),
        toTypesByFamilyNames,
        replaceValuelistIdsWithValuelists(valuelistsConfiguration as any),
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


function replaceValuelistIdsWithValuelists(valuelistDefinitionsMap: Map<ValuelistDefinition>)
    : (types: Map<TransientTypeDefinition>) => Map<TransientTypeDefinition> {

    return map(
        cond(
            on(TransientTypeDefinition.FIELDS, isNot(undefinedOrEmpty)),
            update(TransientTypeDefinition.FIELDS,
                map(
                    cond(
                        on(TransientFieldDefinition.VALUELISTID, isDefined),
                        replaceValuelistIdWithActualValuelist(valuelistDefinitionsMap)))))) as any;
}


function replaceValuelistIdWithActualValuelist(valuelistDefinitionMap: Map<ValuelistDefinition>) {

    return (fd: TransientFieldDefinition) =>
        flow(fd,
            assoc(
                TransientFieldDefinition.VALUELIST,
                keys(valuelistDefinitionMap[fd.valuelistId!].values)),
            dissoc(TransientFieldDefinition.VALUELISTID))
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


// TODO reimplement
function replaceCommonFields(commonFields: Map<any>) {

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


function toTypesByFamilyNames(transientTypes: Map<TransientTypeDefinition>): Map<TransientTypeDefinition> {

    return flow(
        transientTypes,
        keysAndValues,
        reduce(
            (acc: any, [transientTypeName, transientType]) => {
                acc[transientType.typeFamily
                    ? transientType.typeFamily
                    : transientTypeName] = transientType;
                return acc;
            }, {}));
}
