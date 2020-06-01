import {
    cond, flow, includedIn, isDefined, isNot, keys, Mapping, Map, on,
    subtract, undefinedOrEmpty, identity, compose, Pair, dissoc,
    pairWith, prune, filter, reduce, values, update as updateObject, flatten, to
} from 'tsfun';
import {assoc, update, lookup, map} from 'tsfun/associative';
import {clone} from 'tsfun/struct';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {ConfigurationErrors} from './configuration-errors';
import {ValuelistDefinition} from '../model/valuelist-definition';
import {withDissoc} from '../../util/utils';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {mergeBuiltInWithLibraryCategories} from './merge-builtin-with-library-categories';
import {Assertions} from './assertions';
import {getDefinedParents, iterateOverFieldsOfCategories} from './helpers';
import {addSourceField} from './add-source-field';
import {mergeCategories} from './merge-categories';
import {addExtraFields} from './add-extra-fields';
import {copy} from 'tsfun/src/collection';
import {hideFields} from './hide-fields';
import {RelationDefinition} from '../model/relation-definition';
import {addRelations} from './add-relations';
import {applyLanguage} from './apply-language';
import {applySearchConfiguration} from './apply-search-configuration';
import {orderFields} from './order-fields';
import {makeCategoriesTree} from './make-categories-tree';
import {RawProjectConfiguration} from '../project-configuration';
import {Category} from '../model/category';
import {Group, Groups} from '../model/group';
import {Labelled, namedArrayToNamedMap, sortNamedArray} from '../../util/named';
import {RelationsUtil} from '../relations-utils';
import {CategoryDefinition} from '../model/category-definition';
import {ProjectCategoriesHelper} from '../project-categories-helper';
import {mapCategoriesTree} from './map-categories-tree';
import {Name} from '../../constants';
import {ModelUtil} from '../../model/model-util';
import Label = ModelUtil.Label;
import {FieldDefinition} from '../model/field-definition';


const CATEGORIES = 'categories';


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
                                             languageConfiguration: any = {},
                                             customLanguageConfiguration: any = {},
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
        eraseUnusedCategories(keys(customCategories)),
        replaceCommonFields(commonFields),
        insertValuelistIds,
        Assertions.assertValuelistIdsProvided,
        hideFields(customCategories),
        toCategoriesByFamilyNames,
        replaceValuelistIdsWithValuelists(valuelistsConfiguration),
        addExtraFields(extraFields),
        wrapCategoriesInObject,
        addRelations(relations),
        applyLanguage(languageConfiguration),
        applyLanguage(customLanguageConfiguration),
        updateObject(CATEGORIES, processCategories(
            orderConfiguration, validateFields, languageConfiguration, searchConfiguration, relations)),
        asRawProjectConfiguration);
}


const asRawProjectConfiguration = ({categories, relations}: any) => ([categories, relations]);


function processCategories(orderConfiguration: any,
                           validateFields: any,
                           languageConfiguration: any,
                           searchConfiguration: any,
                           relations: Array<RelationDefinition>): Mapping<Map<CategoryDefinition>, Array<Category>> {

    const sortCategoryGroups = updateObject(Category.GROUPS, sortGroups(Groups.DEFAULT_ORDER));

    const isGeometryCategory = (categoriesTree: Array<Category>, category: Name) => ProjectCategoriesHelper
        .isGeometryCategory(categoriesTreeToCategoriesMap(categoriesTree), category);

    const adjustCategoriesTree = compose(
        mapCategoriesTree(putRelationsIntoGroups(relations)),
        mapCategoriesTree(sortCategoryGroups),
        mapCategoriesTree(setGroupLabels(languageConfiguration.groups || {})),
        setGeometriesInGroups(languageConfiguration, isGeometryCategory));

    return compose(
        applySearchConfiguration(searchConfiguration),
        addExtraFieldsOrder(orderConfiguration),
        orderFields(orderConfiguration),
        validateFields,
        makeCategoriesTree,
        adjustCategoriesTree,
        categoriesTreeToCategoriesArray,
        orderCategories(orderConfiguration?.categories));
}


function categoriesTreeToCategoriesArray(categoriesTree: Array<Category>): Array<Category> {

    const categories = [];
    for (let parent of categoriesTree) {
        for (let child of parent.children) {
            categories.push(child);
        }
        categories.push(parent);
    }
    return categories;
}



function categoriesTreeToCategoriesMap(topLevelCategories: Array<Category>): Map<Category> {

    const children: Array<Category> = flatten(topLevelCategories.map(to(Category.CHILDREN)));
    return namedArrayToNamedMap(topLevelCategories.concat(children));
}


function setGeometriesInGroups(languageConfiguration: any,
                               isGeometryCategory: (categoriesTree: Array<Category>, categoryName: string) => boolean) {

    return (categoriesTree: Array<Category>) => {

        return mapCategoriesTree(category => {

            if (isGeometryCategory(categoriesTree, category.name)) {
                adjustGeometryCategory(
                    category,
                    languageConfiguration && languageConfiguration.other && languageConfiguration.other['geometry']
                        ? languageConfiguration.other['geometry']
                        : undefined);
            }
            return category;
        })(categoriesTree);
    }
}


function adjustGeometryCategory(category: Category, label?: Label) {

    let geometryGroup = category.groups.find(group => group.name === Groups.POSITION);
    if (!geometryGroup) {
        geometryGroup = Group.create(Groups.POSITION);
        category.groups.push(geometryGroup);
    }

    const geometryField: FieldDefinition = {
        name: 'geometry',
        group: 'position',
        inputType: 'geometry',
        editable: true,
        label: 'geometry'
    }
    if (label) geometryField['label'] = label;
    geometryGroup.fields.unshift(geometryField);
}


function putRelationsIntoGroups(relations: Array<RelationDefinition>) {

    return (category: Category): /* ! modified in place */ Category => {

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


function sortGroups(defaultOrder: string[]) {

    return (groups: Map<Group>) => flow(
        defaultOrder,
        map(lookup(groups)),
        prune
    );
}


function orderCategories(categoriesOrder: string[] = []) {

    return (categories: Array<Category>): Array<Category> => {

        return flow(
            categories,
            sortNamedArray(categoriesOrder),
            map(update(Category.CHILDREN, orderCategories(categoriesOrder)))
        ) as any;
    }
}


function setGroupLabels(groupLabels: Map<string>) {

    return (category: Category) => {

        const groupLabel = ({ name: name }: Group) => {

            if (name === Groups.PARENT) return category.parentCategory?.label ?? category.label;
            else if (name === Groups.CHILD) return category.label;
            else return lookup(groupLabels)(name)
        };

        return update(
            Category.GROUPS,
            compose(
                map(pairWith(groupLabel)),
                map(([group, label]: Pair<Group, string>) => assoc(Labelled.LABEL, label)(group as any))) as any)(category);
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


function wrapCategoriesInObject(configuration: Map<TransientCategoryDefinition>) {

    return { categories: configuration, relations: [] }
}


function insertValuelistIds(mergedCategories: Map<TransientCategoryDefinition>) {

    iterateOverFieldsOfCategories(mergedCategories,
        (categoryName, category, fieldName, field) => {

        if (category.valuelists && category.valuelists[fieldName]) {
            field.valuelistId = category.valuelists[fieldName];
        }
    });

    return mergedCategories;
}


function replaceValuelistIdsWithValuelists(valuelistDefinitionsMap: Map<ValuelistDefinition>)
    : Mapping<Map<TransientCategoryDefinition>> {

    return map(
        cond(
            on(TransientCategoryDefinition.FIELDS, isNot(undefinedOrEmpty)),
            update(TransientCategoryDefinition.FIELDS,
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


function eraseUnusedCategories(selectedCategoriesNames: string[])
    : Mapping<Map<TransientCategoryDefinition>> {

    return (categories: Map<TransientCategoryDefinition>) => {

        const keysOfUnselectedCategories =
            flow(
                categories,
                keys,
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
        reduce(
            (acc: any, transientCategory, transientCategoryName) => {
                acc[transientCategory.categoryName
                    ? transientCategory.categoryName
                    : transientCategoryName] = transientCategory;
                return acc;
            }, {}));
}
