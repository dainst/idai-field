import { compose, cond, detach, filter, flow, identity, includedIn, isDefined, isNot, Map, map, Mapping,
    on, or, update as updateStruct, assoc, isUndefinedOrEmpty, not, curry } from 'tsfun';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { CustomFormDefinition } from '../model/form/custom-form-definition';
import { LanguageConfigurations } from '../model/language/language-configurations';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { TransientFieldDefinition } from '../model/field/transient-field-definition';
import { RawProjectConfiguration } from '../../services/project-configuration';
import { addRelations } from './add-relations';
import { addSourceField } from './add-source-field';
import { applyLanguageConfigurations } from './apply-language-configurations';
import { Assertions } from './assertions';
import { iterateOverFields } from './helpers';
import { hideFields } from './hide-fields';
import { makeCategoryForest } from './make-category-forest';
import { mergeWithCustomForms } from './merge-with-custom-forms';
import { setGroupLabels } from './set-group-labels';
import { Valuelist } from '../../model/configuration/valuelist';
import { Relation } from '../../model/configuration/relation';
import { CategoryForm } from '../../model/configuration/category-form';
import { mergeBuiltInWithLibraryCategories } from './merge-built-in-with-library-categories';
import { getAvailableForms } from './get-available-forms';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { LibraryFormDefinition } from '../model/form/library-form-definition';
import { Forest, Tree } from '../../tools/forest';
import { sortStructArray } from '../../tools/sort-struct-array';
import { withDissoc } from '../../tools/utils';
import { linkParentAndChildInstances } from '../category-forest';


const CATEGORIES = 0;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildRawProjectConfiguration(builtInCategories: Map<BuiltInCategoryDefinition>,
                                             libraryCategories: Map<LibraryCategoryDefinition>,
                                             libraryForms: Map<LibraryFormDefinition>,
                                             customForms?: Map<CustomFormDefinition>,
                                             commonFields: Map<any> = {},
                                             valuelistsConfiguration: Map<Valuelist> = {},
                                             builtInFields: Map<any> = {},
                                             relations: Array<Relation> = [],
                                             languageConfigurations: LanguageConfigurations = { default: {}, complete: {} },
                                             categoriesOrder: string[] = [],
                                             validateFields: any = identity,    // TODO Check if this has to be a parameter
                                             selectedParentCategories?: string[]): RawProjectConfiguration {

    Assertions.performAssertions(
        builtInCategories, libraryCategories, libraryForms, commonFields, valuelistsConfiguration, customForms
    );
    addSourceField(builtInCategories, libraryCategories, libraryForms, commonFields, customForms);

    const categories: Map<TransientCategoryDefinition> = mergeBuiltInWithLibraryCategories(
        builtInCategories, libraryCategories
    );

    return flow(
        getAvailableForms(categories, libraryForms, builtInFields, commonFields, relations),
        cond(isDefined(customForms), Assertions.assertNoDuplicationInSelection(customForms)),
        setDefaultConstraintIndexed,
        cond(isDefined(customForms), mergeWithCustomForms(customForms, categories, builtInFields, commonFields, relations)),
        cond(isDefined(customForms), removeUnusedForms(Object.keys(customForms ?? {}))),
        insertValuelistIds,
        Assertions.assertValuelistIdsProvided,
        replaceValuelistIdsWithValuelists(valuelistsConfiguration),
        cond(isDefined(customForms), hideFields),
        prepareRawProjectConfiguration,
        addRelations(relations),
        applyLanguageConfigurations(languageConfigurations, categories),
        updateStruct(
            CATEGORIES,
            processForms(
                validateFields, languageConfigurations, categoriesOrder, relations, categories,
                selectedParentCategories
            )
        )
    );
}


const prepareRawProjectConfiguration = (forms: Map<TransientFormDefinition>) => [forms, [] /* relations */];


function processForms(validateFields: any,
                      languageConfigurations: LanguageConfigurations,
                      categoriesOrder: string[],
                      relations: Array<Relation>,
                      categories: Map<TransientCategoryDefinition>,
                      selectedParentCategories?: string[]): Mapping<Map<TransientFormDefinition>, Forest<CategoryForm>> {

    return compose(
        validateFields,
        makeCategoryForest(relations, categories, selectedParentCategories),
        Forest.map(curry(setGroupLabels, languageConfigurations)),
        orderCategories(categoriesOrder),
        linkParentAndChildInstances
    );
}


function setDefaultConstraintIndexed(forms: Map<TransientFormDefinition>): Map<TransientFormDefinition> {

    iterateOverFields(forms, (categoryName, category, fieldName, field) => {
        field.defaultConstraintIndexed = field.constraintIndexed === true;
    });

    return forms;
}


const orderCategories = (categoriesOrder: string[] = []) => (categories: Forest<CategoryForm>): Forest<CategoryForm> =>
    Tree.mapTrees(sortStructArray(categoriesOrder, Tree.ITEMNAMEPATH), categories) as Forest<CategoryForm>;


function insertValuelistIds(forms: Map<TransientFormDefinition>): Map<TransientFormDefinition> {

    iterateOverFields(forms, (_, form: TransientFormDefinition, fieldName, field) => {

        if (form.valuelists && form.valuelists[fieldName]) {
            field.valuelistId = form.valuelists[fieldName];
        }
        if (form.positionValuelists && form.positionValuelists[fieldName]) {
            field.positionValuelistId = form.positionValuelists[fieldName];
        }
    });

    return forms;
}


function replaceValuelistIdsWithValuelists(valuelists: Map<Valuelist>): Mapping<Map<TransientFormDefinition>> {

    return map(
        cond(
            on(TransientFormDefinition.FIELDS, not(isUndefinedOrEmpty)),
            assoc(TransientFormDefinition.FIELDS,
                map(
                    cond(
                        or(
                            on(TransientFieldDefinition.VALUELISTID, isDefined),
                            on(TransientFieldDefinition.POSITION_VALUELIST_ID, isDefined)
                        ),
                        replaceValuelistIdWithActualValuelist(valuelists)
                    )
                )
            )
        )
    ) as any;
}


function replaceValuelistIdWithActualValuelist(valuelists: Map<Valuelist>) {

    return (field: TransientFieldDefinition) => flow(
        field,
        assoc(TransientFieldDefinition.VALUELIST, valuelists[field.valuelistId!]),
        assoc(TransientFieldDefinition.POSITION_VALUES, valuelists[field.positionValuelistId!]),
        detach(TransientFieldDefinition.VALUELISTID),
        detach(TransientFieldDefinition.POSITION_VALUELIST_ID)
    );
}


function removeUnusedForms(selectedFormsNames: string[]): Mapping<Map<TransientFormDefinition>> {

    return (forms: Map<TransientFormDefinition>) => {

        const formsToRemove = flow(
            forms,
            Object.keys,
            filter(isNot(includedIn(selectedFormsNames)))
        );

        return formsToRemove.reduce(withDissoc, forms) as Map<TransientFormDefinition>;
    }
}
