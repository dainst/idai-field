import {flow, forEach, is, keysAndValues, Map} from 'tsfun';
import {BuiltinTypeDefinition} from '../model/builtin-type-definition';
import {LibraryTypeDefinition} from '../model/library-type-definition';
import {CustomTypeDefinition} from '../model/custom-type-definition';
import {ValuelistDefinition, ValuelistDefinitions} from '../model/valuelist-definition';
import {TransientTypeDefinition} from '../model/transient-type-definition';
import {ConfigurationErrors} from './configuration-errors';
import {getDefinedParents, iterateOverFieldsOfTypes} from './helpers';


type CommonFields = {[fieldName: string]: any};


export module Assertions {

    export function performAssertions(builtInTypes: Map<BuiltinTypeDefinition>,
                               libraryTypes: Map<LibraryTypeDefinition>,
                               customTypes: Map<CustomTypeDefinition>,
                               commonFields: CommonFields,
                               valuelistsConfiguration: ValuelistDefinitions) {

        assertTypesAndValuelistsStructurallyValid(Object.keys(builtInTypes), libraryTypes, customTypes, valuelistsConfiguration);
        assertSubtypingIsLegal(builtInTypes, libraryTypes);
        assertSubtypingIsLegal(builtInTypes, customTypes);
        assertNoCommonFieldInputTypeChanges(commonFields, libraryTypes);
        assertNoCommonFieldInputTypeChanges(commonFields, customTypes);
        assertTypeFamiliesConsistent(libraryTypes);
    }


    export function assertInputTypesAreSet(types: Map<TransientTypeDefinition>,
                                           assertInputTypePresentIfNotCommonType: Function) {

        iterateOverFieldsOfTypes(types, (typeName, type, fieldName, field) => {
            assertInputTypePresentIfNotCommonType(typeName, fieldName, field);
        });
    }


    export function assertNoDuplicationInSelection(mergedTypes: Map<TransientTypeDefinition>,
                                                   customTypes: Map<CustomTypeDefinition>) {

        Object.keys(customTypes).reduce((selectedTypeFamilies, customTypeName) => {

            const selectedType = mergedTypes[customTypeName];
            if (!selectedType) return selectedTypeFamilies;
            if (!selectedTypeFamilies.includes(selectedType.typeFamily)) {
                return selectedTypeFamilies.concat([selectedType.typeFamily]);
            }
            throw [ConfigurationErrors.DUPLICATION_IN_SELECTION, selectedType.typeFamily];

        }, [] as string[]);
    }


    export function assertValuelistIdsProvided(mergedTypes: Map<TransientTypeDefinition>) {

        iterateOverFieldsOfTypes(mergedTypes, (typeName, type, fieldName, field) => {
            if (['dropdown', 'checkboxes', 'radio'].includes(field.inputType ? field.inputType : '')) {

                if (!field.valuelistId && !field.valuelistFromProjectField) {
                    throw [ConfigurationErrors.MISSING_FIELD_PROPERTY, 'valuelistId', typeName, fieldName];
                }
            }
        });
    }


    function assertSubtypingIsLegal(builtinTypes: Map<BuiltinTypeDefinition>, types: any) {

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


    function assertTypesAndValuelistsStructurallyValid(builtInTypes: string[],
                                                       libraryTypes: Map<LibraryTypeDefinition>,
                                                       customTypes: Map<CustomTypeDefinition>,
                                                       valuelistDefinitions: ValuelistDefinitions) {

        const assertLibraryTypeValid = LibraryTypeDefinition.makeAssertIsValid(builtInTypes);
        const assertCustomTypeValid = CustomTypeDefinition.makeAssertIsValid(builtInTypes, Object.keys(libraryTypes));

        keysAndValues(libraryTypes).forEach(assertLibraryTypeValid);
        keysAndValues(customTypes).forEach(assertCustomTypeValid);
        keysAndValues(valuelistDefinitions).forEach(ValuelistDefinition.assertIsValid);
    }


    function assertTypeFamiliesConsistent(libraryTypes: Map<LibraryTypeDefinition>) {

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
                                                 types: Map<LibraryTypeDefinition>|Map<CustomTypeDefinition>) {

        const commonFieldNames = Object.keys(commonFields);

        iterateOverFieldsOfTypes(types as any, (typeName, type, fieldName, field) => {

            if (commonFieldNames.includes(fieldName)) {
                if (field.inputType) {
                    throw [ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, typeName, fieldName];
                }
            }
        });
    }
}