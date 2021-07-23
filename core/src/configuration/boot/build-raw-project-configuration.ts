import { clone, compose, cond, copy, detach, filter, flow, identity, includedIn, isDefined, isNot,
    Map, map, Mapping, on, or, update as updateStruct, assoc, isUndefinedOrEmpty, not, curry } from 'tsfun';
import { Relation, Category } from '../../model';
import { Valuelist } from '../../model';
import { Forest,Tree, withDissoc, sortStructArray } from '../../tools';
import { linkParentAndChildInstances } from '../category-forest';
import { BuiltinCategoryDefinition } from '../model/builtin-category-definition';
import { CustomCategoryDefinition } from '../model/custom-category-definition';
import { LanguageConfigurations } from '../model/language-configurations';
import { LibraryCategoryDefinition } from '../model/library-category-definition';
import { TransientCategoryDefinition, TransientFieldDefinition } from '../model/transient-category-definition';
import { RawProjectConfiguration } from '../../services/project-configuration';
import { addExtraFields } from './add-extra-fields';
import { addRelations } from './add-relations';
import { addSourceField } from './add-source-field';
import { applyLanguageConfigurations } from './apply-language-configurations';
import { Assertions } from './assertions';
import { ConfigurationErrors } from './configuration-errors';
import { iterateOverFieldsOfCategories } from './helpers';
import { hideFields } from './hide-fields';
import { makeCategoryForest } from './make-category-forest';
import { mergeBuiltInWithLibraryCategories } from './merge-builtin-with-library-categories';
import { mergeWithCustomCategories } from './merge-with-custom-categories';
import { setGroupLabels } from './set-group-labels';


const CATEGORIES = 0;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildRawProjectConfiguration(builtInCategories: Map<BuiltinCategoryDefinition>,
                                             libraryCategories: Map<LibraryCategoryDefinition>,
                                             customCategories?: Map<CustomCategoryDefinition>,
                                             commonFields: Map<any> = {},
                                             valuelistsConfiguration: Map<Valuelist> = {},
                                             extraFields: Map<any> = {},
                                             relations: Array<Relation> = [],
                                             languageConfigurations: LanguageConfigurations = { default: {}, complete: {} },
                                             categoriesOrder: string[] = [],
                                             validateFields: any = identity,
                                             selectedParentCategories?: string[]): RawProjectConfiguration {

    Assertions.performAssertions(builtInCategories, libraryCategories, commonFields, valuelistsConfiguration, customCategories);
    addSourceField(builtInCategories, libraryCategories, customCategories, commonFields);

    return flow(
        mergeBuiltInWithLibraryCategories(builtInCategories, libraryCategories),
        Assertions.assertInputTypesAreSet(Assertions.assertInputTypePresentIfNotCommonField(commonFields)),
        cond(isDefined(customCategories), Assertions.assertNoDuplicationInSelection(customCategories)),
        setDefaultConstraintIndexed,
        cond(isDefined(customCategories), mergeWithCustomCategories(
            Assertions.assertInputTypePresentIfNotCommonField(commonFields), customCategories
        )),
        cond(isDefined(customCategories), eraseUnusedCategories(Object.keys(customCategories ?? {}))),
        replaceCommonFields(commonFields),
        insertValuelistIds,
        Assertions.assertValuelistIdsProvided,
        cond(isDefined(customCategories), hideFields(customCategories)),
        replaceValuelistIdsWithValuelists(valuelistsConfiguration),
        addExtraFields(extraFields),
        setCategoryNames,
        prepareRawProjectConfiguration,
        addRelations(relations),
        applyLanguageConfigurations(languageConfigurations),
        updateStruct(
            CATEGORIES,
            processCategories(
                validateFields, languageConfigurations, categoriesOrder, relations, selectedParentCategories
            )
        )
    );
}


const prepareRawProjectConfiguration = (configuration: Map<TransientCategoryDefinition>) => [configuration, [] /* relations */];


function processCategories(validateFields: any,
                           languageConfigurations: LanguageConfigurations,
                           categoriesOrder: string[],
                           relations: Array<Relation>,
                           selectedParentCategories?: string[])
                           : Mapping<Map<TransientCategoryDefinition>, Forest<Category>> {

    return compose(
        validateFields,
        makeCategoryForest(relations, selectedParentCategories),
        Tree.mapForest(curry(setGroupLabels, languageConfigurations)),
        orderCategories(categoriesOrder),
        linkParentAndChildInstances
    );
}


function setDefaultConstraintIndexed(categories: Map<TransientCategoryDefinition>): Map<TransientCategoryDefinition> {

    iterateOverFieldsOfCategories(categories, (categoryName, category, fieldName, field) => {
        field.defaultConstraintIndexed = field.constraintIndexed === true;
    });

    return categories;
}


function setCategoryNames(categories: Map<TransientCategoryDefinition>): Map<TransientCategoryDefinition> {

    Object.keys(categories).forEach(key => {
        const category: TransientCategoryDefinition = categories[key];
        category.name = category.categoryName ?? key;
    });

    return categories;
}


const orderCategories = (categoriesOrder: string[] = []) => (categories: Forest<Category>): Forest<Category> =>
    Tree.mapTrees(sortStructArray(categoriesOrder, Tree.ITEMNAMEPATH), categories) as Forest<Category>;


function insertValuelistIds(mergedCategories: Map<TransientCategoryDefinition>): Map<TransientCategoryDefinition> {

    iterateOverFieldsOfCategories(mergedCategories, (categoryName, category, fieldName, field) => {

        if (category.valuelists && category.valuelists[fieldName]) {
            field.valuelistId = category.valuelists[fieldName];
        }
        if (category.positionValuelists && category.positionValuelists[fieldName]) {
            field.positionValuelistId = category.positionValuelists[fieldName];
        }
    });

    return mergedCategories;
}


function replaceValuelistIdsWithValuelists(valuelistDefinitionsMap: Map<Valuelist>)
    : Mapping<Map<TransientCategoryDefinition>> {

    return map(
        cond(
            on(TransientCategoryDefinition.FIELDS, not(isUndefinedOrEmpty)),
            assoc(TransientCategoryDefinition.FIELDS,
                map(
                    cond(
                        or(
                            on(TransientFieldDefinition.VALUELISTID, isDefined),
                            on(TransientFieldDefinition.POSITION_VALUELIST_ID, isDefined)
                        ),
                        replaceValuelistIdWithActualValuelist(valuelistDefinitionsMap)))))) as any;
}


function replaceValuelistIdWithActualValuelist(valuelistDefinitionMap: Map<Valuelist>) {

    return (fd: TransientFieldDefinition) =>
        flow(fd,
            assoc(TransientFieldDefinition.VALUELIST, valuelistDefinitionMap[fd.valuelistId!]),
            assoc(TransientFieldDefinition.POSITION_VALUES, valuelistDefinitionMap[fd.positionValuelistId!]),
            detach(TransientFieldDefinition.VALUELISTID),
            detach(TransientFieldDefinition.POSITION_VALUELIST_ID)
        );
}


function eraseUnusedCategories(selectedCategoriesNames: string[])
    : Mapping<Map<TransientCategoryDefinition>> {

    return (categories: Map<TransientCategoryDefinition>) => {

        const categoriesToErase = flow(
            categories,
            Object.keys,
            filter(isNot(includedIn(selectedCategoriesNames)))
        );
        return categoriesToErase.reduce(withDissoc, categories) as Map<TransientCategoryDefinition>;
    }
}


function replaceCommonFields(commonFields: Map<any>)
        : Mapping<Map<TransientCategoryDefinition>> {

    return map(
        cond(
            on(TransientCategoryDefinition.COMMONS, isDefined),
            (mergedCategory: TransientCategoryDefinition) => {

                const clonedMergedCategory: any = clone(mergedCategory);
                for (let commonFieldName of clonedMergedCategory.commons) {
                    if (!commonFields[commonFieldName]) {
                        throw [ConfigurationErrors.COMMON_FIELD_NOT_PROVIDED, commonFieldName];
                    }

                    if (!clonedMergedCategory.fields[commonFieldName]) {
                        clonedMergedCategory.fields[commonFieldName] = {};
                    }

                    clonedMergedCategory.fields[commonFieldName] = copy(commonFields[commonFieldName]) as any;
                }
                delete clonedMergedCategory.commons;
                return clonedMergedCategory;
            })) as any;
}
