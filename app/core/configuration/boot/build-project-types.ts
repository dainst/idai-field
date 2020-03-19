import {assoc, clone, cond, dissoc, flow, includedIn, isDefined, isNot, keys, keysAndValues, map, Map, on,
    reduce, subtract, undefinedOrEmpty, update} from 'tsfun';
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
import {copy} from 'tsfun/src/collection';
import {hideFields} from './hide-fields';
import {RelationDefinition} from '../model/relation-definition';
import {addRelations} from './add-relations';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildProjectTypes(builtInTypes: Map<BuiltinTypeDefinition>,
                                  libraryTypes: Map<LibraryTypeDefinition>,
                                  customTypes: Map<CustomTypeDefinition> = {},
                                  commonFields: Map = {},
                                  valuelistsConfiguration: Map<ValuelistDefinition> = {},
                                  extraFields: Map = {},
                                  relations: Array<RelationDefinition> = []) {

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
        addExtraFields(extraFields),
        wrapTypesInObject,
        addRelations(relations));
}


function wrapTypesInObject(configuration: Map<TransientTypeDefinition>) {

    return { types: configuration, relations: [] }
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
            assoc(TransientFieldDefinition.VALUELIST, valuelistDefinitionMap[fd.valuelistId!]),
            dissoc(TransientFieldDefinition.VALUELISTID)
        );
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


function replaceCommonFields(commonFields: Map)
    : (mergedTypes: Map<TransientTypeDefinition>) => Map<TransientTypeDefinition> {

    return map(
        cond(
            on(TransientTypeDefinition.COMMONS, isDefined),
            (mergedType_: TransientTypeDefinition) => {

                const mergedType = clone(mergedType_);
                for (let commonFieldName of mergedType.commons) {
                    if (!commonFields[commonFieldName]) {
                        throw [ConfigurationErrors.COMMON_FIELD_NOT_PROVIDED, commonFieldName];
                    }

                    if (!mergedType.fields[commonFieldName]) mergedType.fields[commonFieldName] = {};
                    mergedType.fields[commonFieldName] = copy(commonFields[commonFieldName]) as any;
                }
                delete mergedType.commons;
                return mergedType;
            }));
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
