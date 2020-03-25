import {assoc, clone, cond, dissoc, flow, includedIn, isDefined, isNot, keys, keysAndValues, Mapping, map, Map, on, is,
    reduce, subtract, undefinedOrEmpty, update, identity, compose, lookup, Pair, pairWith, to, separate} from 'tsfun';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {ConfigurationErrors} from './configuration-errors';
import {ValuelistDefinition} from '../model/valuelist-definition';
import {debugId, withDissoc} from '../../util/utils';
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
import {makeCategoriesMap} from './make-categories-map';
import {RawProjectConfiguration} from '../project-configuration';
import {Category} from '../model/category';
import {Group, Groups} from '../model/group';
import {Named, namedMapToNamedArray} from '../../util/named';


const CATEGORIES = 'categories';

// TODO put into relations into groups
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
        replaceValuelistIdsWithValuelists(valuelistsConfiguration as any),
        addExtraFields(extraFields),
        wrapCategoriesInObject,
        addRelations(relations),
        applyLanguage(languageConfiguration),
        applyLanguage(customLanguageConfiguration),
        applySearchConfiguration(searchConfiguration),
        update(CATEGORIES, processCategories(orderConfiguration, validateFields, languageConfiguration)),
        asRawProjectConfiguration);
}


const asRawProjectConfiguration = ({categories, relations}: any) => ([categories, relations]);


function processCategories(orderConfiguration: any,
                           validateFields: any,
                           languageConfiguration: any) {

    return compose(
        addExtraFieldsOrder(orderConfiguration),
        orderFields(orderConfiguration),
        validateFields,
        makeCategoriesMap,
        setGroupLabels(languageConfiguration),
        namedMapToNamedArray,
        orderCategories(orderConfiguration?.categories));
}


function orderCategories(categoriesOrder: string[] = []) {

    return (categories: Array<Category>) => order(categories, categoriesOrder);
}


function order(categories: Array<Category>, categoriesOrder: string[]) { // TODO reimplement with reduce

    let source = copy(categories);
    let sortedCategories: Array<Category> = [];

    for (let categoryName of categoriesOrder) {
        const [match, rest] = separate(on(Named.NAME, is(categoryName)))(source);
        sortedCategories = sortedCategories.concat(match);
        source = rest;
    }

    const result = sortedCategories.concat(source);
    for (let category of result) { // TODO test
        if (category.children) {
            category.children = order(category.children, categoriesOrder) as any;
        }
    }
    return result;
}


function setGroupLabels(languageConfiguration: any) {

    return map((category: Category) => {

        const getLabel = (name: string) => {

            if (name === Groups.PARENT) return category.parentCategory?.label ?? category.label;
            else if (name === Groups.CHILD) return category.label;
            else return lookup(languageConfiguration.groups || {} /* TODO review */)(name)
        };

        return update(
            Category.GROUPS,
            compose(
                map(pairWith(compose(to(Named.NAME), getLabel))),
                map(([group, label]: Pair<Group, string>) => assoc(Group.LABEL, label)(group as any))))(category);
    });
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

    return { categories: configuration, relations: [], groups: {} }
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


function eraseUnusedCategories(selectedCategoriesNames: string[]) {

    return (categories: Map<TransientCategoryDefinition>): Map<TransientCategoryDefinition> => {

        const keysOfUnselectedCategories = Object.keys(categories)
            .filter(isNot(includedIn(selectedCategoriesNames)));

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
            }));
}


function toCategoriesByFamilyNames(transientCategories: Map<TransientCategoryDefinition>)
        : Map<TransientCategoryDefinition> { // TODO impl this as const, with compose

    return flow(
        transientCategories,
        keysAndValues,
        reduce(
            (acc: any, [transientCategoryName, transientCategory]) => {
                acc[transientCategory.categoryName
                    ? transientCategory.categoryName
                    : transientCategoryName] = transientCategory;
                return acc;
            }, {}));
}
