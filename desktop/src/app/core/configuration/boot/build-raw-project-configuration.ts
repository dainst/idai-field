import { Category, CategoryDefinition, FieldDefinition, Group, Groups, RelationDefinition,
    sortStructArray, Tree, Forest, ValuelistDefinition, withDissoc } from 'idai-field-core';
import {
    clone, compose, cond,
    copy, detach, filter, flow, identity, includedIn, isDefined, isNot,
    keysValues, lookup, Map,
    map, Mapping, on,
    or, Pair, pairWith, prune, reduce, subtract, undefinedOrEmpty,
    update, update as updateStruct, assoc
} from 'tsfun';
import { Labelled } from '../../../../../../core/src/tools/named';
import { linkParentAndChildInstances } from '../category-forest';
import { BuiltinCategoryDefinition } from '../model/builtin-category-definition';
import { CustomCategoryDefinition } from '../model/custom-category-definition';
import { LibraryCategoryDefinition } from '../model/library-category-definition';
import { TransientCategoryDefinition, TransientFieldDefinition } from '../model/transient-category-definition';
import { ProjectCategories } from '../project-categories';
import { RawProjectConfiguration } from '../project-configuration';
import { RelationsUtil } from '../relations-utils';
import { addExtraFields } from './add-extra-fields';
import { addRelations } from './add-relations';
import { addSourceField } from './add-source-field';
import { applyLanguageConfigurations } from './apply-language-configurations';
import { applySearchConfiguration } from './apply-search-configuration';
import { Assertions } from './assertions';
import { ConfigurationErrors } from './configuration-errors';
import { getDefinedParents, iterateOverFieldsOfCategories } from './helpers';
import { hideFields } from './hide-fields';
import { makeCategoryForest } from './make-category-forest';
import { mergeBuiltInWithLibraryCategories } from './merge-builtin-with-library-categories';
import { mergeCategories } from './merge-categories';
import { orderFields } from './order-fields';

const CATEGORIES = 0;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildRawProjectConfiguration(builtInCategories: Map<BuiltinCategoryDefinition>,
                                             libraryCategories: Map<LibraryCategoryDefinition>,
                                             customCategories: Map<CustomCategoryDefinition> = {},
                                             commonFields: Map<any> = {},
                                             valuelistsConfiguration: Map<ValuelistDefinition> = {},
                                             extraFields: Map<any> = {},
                                             relations: Array<RelationDefinition> = [],
                                             languageConfigurations: any[] = [],
                                             searchConfiguration: any = {},
                                             orderConfiguration: any = {},
                                             validateFields: any = identity): RawProjectConfiguration {

    Assertions.performAssertions(builtInCategories, libraryCategories, customCategories, commonFields, valuelistsConfiguration);
    addSourceField(builtInCategories, libraryCategories, customCategories, commonFields);

    return flow(
        mergeBuiltInWithLibraryCategories(builtInCategories, libraryCategories),
        Assertions.assertInputTypesAreSet(Assertions.assertInputTypePresentIfNotCommonField(commonFields)),
        Assertions.assertNoDuplicationInSelection(customCategories),
        mergeCategories(customCategories, Assertions.assertInputTypePresentIfNotCommonField(commonFields)),
        eraseUnusedCategories(Object.keys(customCategories)),
        replaceCommonFields(commonFields),
        insertValuelistIds,
        Assertions.assertValuelistIdsProvided,
        hideFields(customCategories),
        toCategoriesByFamilyNames,
        replaceValuelistIdsWithValuelists(valuelistsConfiguration),
        addExtraFields(extraFields),
        prepareRawProjectConfiguration,
        addRelations(relations),
        applyLanguageConfigurations(languageConfigurations),
        updateStruct(CATEGORIES, processCategories(
            orderConfiguration, validateFields, languageConfigurations, searchConfiguration, relations)
        )
    );
}


const prepareRawProjectConfiguration = (configuration: Map<TransientCategoryDefinition>) => [configuration, [] /* relations */];


function processCategories(orderConfiguration: any,
                           validateFields: any,
                           languageConfigurations: any[][],
                           searchConfiguration: any,
                           relations: Array<RelationDefinition>): Mapping<Map<CategoryDefinition>, Forest<Category>> {

    const sortCategoryGroups = update(Category.GROUPS, sortGroups(Groups.DEFAULT_ORDER));

    return compose(
        applySearchConfiguration(searchConfiguration),
        addExtraFieldsOrder(orderConfiguration),
        orderFields(orderConfiguration),
        validateFields,
        makeCategoryForest,
        Tree.mapList(putRelationsIntoGroups(relations)),
        Tree.mapList(sortCategoryGroups),
        Tree.mapList(setGroupLabels(languageConfigurations)),
        setGeometriesInGroups(languageConfigurations),
        orderCategories(orderConfiguration?.categories),
        linkParentAndChildInstances
    );
}


const setGeometriesInGroups = (languageConfigurations: any[]) => (categoriesTree: Forest<Category>) =>
    Tree.mapList(adjustCategoryGeometry(languageConfigurations, categoriesTree), categoriesTree);


function adjustCategoryGeometry(languageConfigurations: any[], categoriesTree: Forest<Category>) {

    return (category: Category /* modified in place */): Category => {

        if (!ProjectCategories.isGeometryCategory(categoriesTree, category.name)) return category;

        let positionGroup = category.groups.find(group => group.name === Groups.POSITION);
        if (!positionGroup) {
            positionGroup = Group.create(Groups.POSITION);
            for (let languageConfiguration of languageConfigurations) {
                if (languageConfiguration.groups?.position) {
                    positionGroup.label = languageConfiguration.groups.position;
                    break;
                }
            }

            category.groups.push(positionGroup);
        }
        const geometryField: FieldDefinition = {
            name: 'geometry',
            group: 'position',
            inputType: 'geometry',
            editable: true
        };
        for (let languageConfiguration of languageConfigurations) {
            if (languageConfiguration.other?.geometry) {
                geometryField.label = languageConfiguration.other.geometry;
                break;
            }
        }

        positionGroup.fields.unshift(geometryField);

        return category;
    }
}


function putRelationsIntoGroups(relations: Array<RelationDefinition>) {

    return (category: Category /* modified in place */): Category => {

        const relDefs = RelationsUtil.getRelationDefinitions(relations, category.name);

        for (let relation of relDefs) {
            const groupName: string|undefined = Groups.getGroupNameForRelation(relation.name);
            if (!groupName) continue;

            let group = (category.groups as any)[groupName];
            if (!group) {
                group = Group.create(groupName);
                (category.groups as any)[groupName] = group;
            }
            group.relations.push(relation);
        }
        return category;
    }
}


const sortGroups = (defaultOrder: string[]) => (groups: Map<Group>) =>
    flow(defaultOrder, map(lookup(groups)), prune);


const orderCategories = (categoriesOrder: string[] = []) => (categories: Forest<Category>): Forest<Category> =>
    Tree.mapTrees(sortStructArray(categoriesOrder, Tree.ITEMNAMEPATH), categories) as Forest<Category>;


function setGroupLabels(languageConfigurations: any[]) {

    return (category: Category) => {

        const groupLabel = ({ name: name }: Group) => {

            if (name === Groups.PARENT) {
                return category.parentCategory
                    ? category.parentCategory.label
                    : category.label;
            } else if (name === Groups.CHILD) {
                return category.label;
            } else {
                for (let languageConfiguration of languageConfigurations) {
                    if (languageConfiguration.groups?.[name]) {
                        return languageConfiguration.groups[name];
                    }
                }
            }
        };

        return update(
            Category.GROUPS,
            compose(
                map(pairWith(groupLabel)),
                map(([group, label]: Pair<Group, string>) => assoc(Labelled.LABEL, label)(group as any))))(category);
    };
}


function addExtraFieldsOrder(orderConfiguration: any) {

    return (categories: any) => {

        if (!orderConfiguration.fields) orderConfiguration.fields = {};

        Object.keys(categories).forEach(categoryName => {
            if (!orderConfiguration.fields[categoryName]) orderConfiguration.fields[categoryName] = [];
            orderConfiguration.fields[categoryName]
                = [].concat(orderConfiguration.fields[categoryName]);
        });

        return categories;
    }
}


function insertValuelistIds(mergedCategories: Map<TransientCategoryDefinition>) {

    iterateOverFieldsOfCategories(mergedCategories,
        (categoryName, category, fieldName, field) => {

        if (category.valuelists && category.valuelists[fieldName]) {
            field.valuelistId = category.valuelists[fieldName];
        }
        if (category.positionValuelists && category.positionValuelists[fieldName]) {
            field.positionValuelistId = category.positionValuelists[fieldName];
        }
    });

    return mergedCategories;
}


function replaceValuelistIdsWithValuelists(valuelistDefinitionsMap: Map<ValuelistDefinition>)
    : Mapping<Map<TransientCategoryDefinition>> {

    return map(
        cond(
            on(TransientCategoryDefinition.FIELDS, isNot(undefinedOrEmpty)),
            assoc(TransientCategoryDefinition.FIELDS,
                map(
                    cond(
                        or(
                            on(TransientFieldDefinition.VALUELISTID, isDefined),
                            on(TransientFieldDefinition.POSITION_VALUELIST_ID, isDefined)
                        ),
                        replaceValuelistIdWithActualValuelist(valuelistDefinitionsMap)))))) as any;
}


function replaceValuelistIdWithActualValuelist(valuelistDefinitionMap: Map<ValuelistDefinition>) {

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

        const keysOfUnselectedCategories =
            flow(
                categories,
                Object.keys,
                filter(isNot(includedIn(selectedCategoriesNames)))
            );

        const parentNamesOfSelectedCategories: string[] = flow(
            keysOfUnselectedCategories,
            reduce(withDissoc, categories),
            getDefinedParents
        );

        const categoriesToErase = subtract(parentNamesOfSelectedCategories)(keysOfUnselectedCategories);
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


function toCategoriesByFamilyNames(transientCategories: Map<TransientCategoryDefinition>)
        : Map<TransientCategoryDefinition> {

    return flow(
        transientCategories,
        keysValues,
        reduce(
            (acc: any, [transientCategoryName, transientCategory]) => {
                acc[transientCategory.categoryName
                    ? transientCategory.categoryName
                    : transientCategoryName] = transientCategory;
                return acc;
            }, {}));
}
