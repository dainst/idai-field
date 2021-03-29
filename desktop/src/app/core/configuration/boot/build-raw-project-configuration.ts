import {cond, flow, includedIn, isDefined, isNot, Mapping, Map, on, subtract, undefinedOrEmpty, identity,
    compose, Pair, dissoc, pairWith, prune, filter, or, copy, update_a as updateAsc, update as updateStruct, lookup, map, keysValues, reduce, clone, update_a, update } from 'tsfun';
import {Tree, ValuelistDefinition} from '@idai-field/core';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {ConfigurationErrors} from './configuration-errors';
import {withDissoc} from '../../util/utils';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {mergeBuiltInWithLibraryCategories} from './merge-builtin-with-library-categories';
import {Assertions} from './assertions';
import {getDefinedParents, iterateOverFieldsOfCategories} from './helpers';
import {addSourceField} from './add-source-field';
import {mergeCategories} from './merge-categories';
import {addExtraFields} from './add-extra-fields';
import {hideFields} from './hide-fields';
import {RelationDefinition} from '../model/relation-definition';
import {addRelations} from './add-relations';
import {applySearchConfiguration} from './apply-search-configuration';
import {orderFields} from './order-fields';
import {makeCategoryTreeList} from './make-category-tree-list';
import {RawProjectConfiguration} from '../project-configuration';
import {Category} from '../model/category';
import {Group, Groups} from '../model/group';
import {Labelled} from '../../../../../../core/src/tools/named';
import {RelationsUtil} from '../relations-utils';
import {CategoryDefinition} from '../model/category-definition';
import {ProjectCategories} from '../project-categories';
import {FieldDefinition} from '../model/field-definition';
import {TreeList, sortStructArray} from '@idai-field/core';
import {linkParentAndChildInstances} from '../category-tree-list';
import {applyLanguageConfigurations} from './apply-language-configurations';

const CATEGORIES = 0;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildRawProjectConfiguration(builtInCategories: Map<BuiltinCategoryDefinition>,
                                             libraryCategories: Map<LibraryCategoryDefinition>,
                                             customCategories: Map<CustomCategoryDefinition> = {},
                                             commonFields: Map = {},
                                             valuelistsConfiguration: Map<ValuelistDefinition> = {},
                                             extraFields: Map = {},
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
                           relations: Array<RelationDefinition>): Mapping<Map<CategoryDefinition>, TreeList<Category>> {

    const sortCategoryGroups = update(Category.GROUPS, sortGroups(Groups.DEFAULT_ORDER));

    return compose(
        applySearchConfiguration(searchConfiguration),
        addExtraFieldsOrder(orderConfiguration),
        orderFields(orderConfiguration),
        validateFields,
        makeCategoryTreeList,
        Tree.mapList(putRelationsIntoGroups(relations)),
        Tree.mapList(sortCategoryGroups),
        Tree.mapList(setGroupLabels(languageConfigurations)),
        setGeometriesInGroups(languageConfigurations),
        orderCategories(orderConfiguration?.categories),
        linkParentAndChildInstances
    );
}


const setGeometriesInGroups = (languageConfigurations: any[]) => (categoriesTree: TreeList<Category>) =>
    Tree.mapList(adjustCategoryGeometry(languageConfigurations, categoriesTree), categoriesTree);


function adjustCategoryGeometry(languageConfigurations: any[], categoriesTree: TreeList<Category>) {

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


const orderCategories = (categoriesOrder: string[] = []) => (categories: TreeList<Category>): TreeList<Category> =>
    Tree.mapTrees(sortStructArray(categoriesOrder, Tree.ITEMNAMEPATH), categories) as TreeList<Category>;


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
                map(([group, label]: Pair<Group, string>) => updateAsc(Labelled.LABEL, label)(group as any))))(category);
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
            update_a(TransientCategoryDefinition.FIELDS,
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
            updateAsc(TransientFieldDefinition.VALUELIST, valuelistDefinitionMap[fd.valuelistId!]),
            updateAsc(TransientFieldDefinition.POSITION_VALUES, valuelistDefinitionMap[fd.positionValuelistId!]),
            dissoc(TransientFieldDefinition.VALUELISTID),
            dissoc(TransientFieldDefinition.POSITION_VALUELIST_ID)
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


function replaceCommonFields(commonFields: Map)
        : Mapping<Map<TransientCategoryDefinition>> {

    return map(
        cond(
            on(TransientCategoryDefinition.COMMONS, isDefined),
            (mergedCategory: TransientCategoryDefinition) => {

                const clonedMergedCategory = clone(mergedCategory);
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
            (acc: any, [transientCategoryName, transientCategory]: any /* TODO review any*/) => {
                acc[transientCategory.categoryName
                    ? transientCategory.categoryName
                    : transientCategoryName] = transientCategory;
                return acc;
            }, {}));
}
