import { filter, flow, forEach, is, keysValues, map, Map, set} from 'tsfun';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { ConfigurationErrors } from './configuration-errors';
import { getDefinedParents, iterateOverFields } from './helpers';
import { Named } from '../../tools/named';
import { LibraryFormDefinition } from '../model/form/library-form-definition';
import { CustomFormDefinition } from '../model/form/custom-form-definition';
import { Valuelist } from '../../model/configuration/valuelist';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { BaseCategoryDefinition, BaseFieldDefinition } from '../model';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { Field } from '../../model/configuration/field';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module Assertions {

    export function performAssertions(builtInCategories: Map<BuiltInCategoryDefinition>,
                                      libraryCategories: Map<LibraryCategoryDefinition>,
                                      libraryForms: Map<LibraryFormDefinition>,
                                      commonFields: Map<BuiltInFieldDefinition>,
                                      valuelistsConfiguration: Map<Valuelist>,
                                      customForms?: Map<CustomFormDefinition>) {

        assertStructurallyValid(
            builtInCategories, libraryCategories, libraryForms, valuelistsConfiguration, customForms
        );

        assertSubtypingIsLegal(builtInCategories, libraryCategories);
        if (customForms) assertSubtypingIsLegal(builtInCategories, customForms);

        assertNoCommonFieldWithValuelistFromProjectFieldGetsNewValuelist(
            commonFields, libraryForms, customForms ?? {}
        );

        assertInputTypesAreSet(builtInCategories, commonFields);
        assertInputTypesAreSet(libraryCategories, commonFields);
    }


    export function assertNoDuplicationInSelection(customForms: Map<CustomFormDefinition>) {

        return (forms: Map<TransientFormDefinition>) => {

            Object.keys(customForms).reduce((selectedFormNames, formName) => {
                const form = forms[formName];
                if (!form) return selectedFormNames;

                if (!selectedFormNames.includes(form.categoryName)) {
                    return selectedFormNames.concat([form.categoryName]);
                } else {
                    throw [[ConfigurationErrors.DUPLICATION_IN_SELECTION, form.categoryName]];
                }
            }, [] as string[]);

            return forms;
        }
    }


    function assertInputTypesAreSet(categories: Map<BaseCategoryDefinition|CustomFormDefinition>,
                                    commonFields: Map<BuiltInFieldDefinition>) {

        iterateOverFields(categories, (categoryName, _, fieldName, field) => {
            assertInputTypePresentIfNotCommonField(categoryName, fieldName, field, commonFields);
        });
    }


    function assertInputTypePresentIfNotCommonField(categoryName: string, fieldName: string,
                                                    field: BaseFieldDefinition,
                                                    commonFields: Map<BuiltInFieldDefinition>) {

        if (!field.inputType && !Object.keys(commonFields).includes(fieldName)) {
            throw [[ConfigurationErrors.MISSING_FIELD_PROPERTY, 'inputType', categoryName, fieldName]];
        }
    }


    export function assertValuelistIdsProvided(definitions: Map<TransientFormDefinition|TransientCategoryDefinition>) {

        iterateOverFields(definitions, (formName, _, fieldName, field) => {

            if (Field.InputType.VALUELIST_INPUT_TYPES.includes(field.inputType ? field.inputType : '')) {
                if (!field.valuelistId && !field.valuelist && !field.valuelistFromProjectField) {
                    throw [[ConfigurationErrors.NO_VALUELIST_PROVIDED, formName, fieldName]];
                }
            }
        });

        return definitions;
    }


    function assertSubtypingIsLegal(builtInCategories: Map<BuiltInCategoryDefinition>,
                                    categories: Map<LibraryCategoryDefinition|CustomFormDefinition>) {

        flow(categories,
            filter((_, categoryName) => !builtInCategories[categoryName]),
            getDefinedParents,
            forEach((parent: any) => {
                const found = Object.keys(builtInCategories).find(is(parent));
                if (!found) throw [ConfigurationErrors.INVALID_CONFIG_PARENT_NOT_DEFINED, parent];
                const foundBuiltIn = builtInCategories[found];
                if (!foundBuiltIn.supercategory || !foundBuiltIn.userDefinedSubcategoriesAllowed) {
                    throw [ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, parent];
                }
            }));
    }


    function assertStructurallyValid(builtInCategories: Map<BuiltInCategoryDefinition>,
                                     libraryCategories: Map<LibraryCategoryDefinition>,
                                     libraryForms: Map<LibraryFormDefinition>,
                                     valuelistsConfiguration: Map<Valuelist>,
                                     customForms?: Map<CustomFormDefinition>) {

        assertLibraryCategoriesStrucuturallyValid(libraryCategories, builtInCategories);
        assertLibraryFormsStrucuturallyValid(libraryForms, builtInCategories, libraryCategories);
        if (customForms) {
            assertCustomFormsStrucuturallyValid(customForms, builtInCategories, libraryCategories, libraryForms);
        }
        assertValuelistsStructurallyValid(valuelistsConfiguration);
    }


    function assertLibraryCategoriesStrucuturallyValid(libraryCategories: Map<LibraryCategoryDefinition>,
                                                       builtInCategories: Map<BuiltInCategoryDefinition>) {

        keysValues(libraryCategories).forEach(
            LibraryCategoryDefinition.makeAssertIsValid(Object.keys(builtInCategories))
        );
    }


    function assertLibraryFormsStrucuturallyValid(libraryForms: Map<LibraryFormDefinition>,
                                                  builtInCategories: Map<BuiltInCategoryDefinition>,
                                                  libraryCategories: Map<LibraryCategoryDefinition>) {

        const categoryNames: string[] = Object.keys(builtInCategories).concat(Object.keys(libraryCategories));
        const assert = LibraryFormDefinition.makeAssertIsValid(categoryNames);
        keysValues(libraryForms).forEach(assert);
    }


    function assertCustomFormsStrucuturallyValid(customForms: Map<CustomFormDefinition>,
                                                 builtInCategories: Map<BuiltInCategoryDefinition>,
                                                 libraryCategories: Map<LibraryCategoryDefinition>,
                                                 libraryForms: Map<LibraryFormDefinition>) {

        const formNames: string[] = set(
            Object.keys(builtInCategories)
                .concat(Object.keys(libraryCategories))
                .concat(Object.keys(libraryForms))
        );

        const assert = CustomFormDefinition.makeAssertIsValid(formNames);
        keysValues(customForms).forEach(assert);
    }


    function assertValuelistsStructurallyValid(valuelistDefinitions: Map<Valuelist>) {

        forEach(valuelistDefinitions, (vd, vdId) => {
            const result = Valuelist.assertIsValid(vd);
            if (result !== undefined && result.length > 1 && result[0] === 'missing') {
                throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, result[1], vdId];
            }
        });
    }


    function assertNoCommonFieldWithValuelistFromProjectFieldGetsNewValuelist(commonFields: Map<any>,
                                                                              libraryForms: Map<LibraryFormDefinition>,
                                                                              customForms: Map<CustomFormDefinition>) {

        const forms = Named.mapToNamedArray(libraryForms).concat(Named.mapToNamedArray(customForms)) as Array<Named>;
        for (let form of forms) {
            if (!(form as any)['valuelists']) return;
            for (let fieldName of Object.keys((form as any)['valuelists'])) {
                if (commonFields[fieldName] && commonFields[fieldName].valuelistFromProjectField) {
                    throw [
                        ConfigurationErrors.COMMON_FIELD_VALUELIST_FROM_PROJECTDOC_NOT_TO_BE_OVERWRITTEN,
                        form.name,
                        fieldName
                    ];
                }
            }
        }
    }
}
