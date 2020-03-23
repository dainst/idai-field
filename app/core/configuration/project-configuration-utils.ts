import {map, on, separate, defined, isNot, update, flatten, flow, reduce, assoc, append, Map, values, to,
    lookup, cond, throws, prune} from 'tsfun';
import {MDInternal} from 'idai-components-2';
import {CategoryDefinition} from './model/category-definition';
import {Category} from './model/category';
import {makeLookup} from '../util/utils';
import {RelationDefinition} from './model/relation-definition';
import {ConfigurationDefinition} from './boot/configuration-definition';
import {isUndefined} from 'tsfun/src/predicate';
import {FieldDefinition} from './model/field-definition';
import {DEFAULT_GROUP_ORDER, Group, Groups} from './model/group';
import {GroupUtil} from './group-util';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module ProjectConfigurationUtils {

    import sortGroups = GroupUtil.sortGroups;

    // TODO reimplement; test
    export function getCategoryAndSubcategories(projectCategoriesMap: Map<Category>,
                                                supercategoryName: string): Map<Category> {

        const subcategories: any = {};

        if (projectCategoriesMap[supercategoryName]) {
            subcategories[supercategoryName] = projectCategoriesMap[supercategoryName];

            if (projectCategoriesMap[supercategoryName].children) {
                for (let i = projectCategoriesMap[supercategoryName].children.length - 1; i >= 0; i--) {
                    subcategories[projectCategoriesMap[supercategoryName].children[i].name]
                        = projectCategoriesMap[supercategoryName].children[i];
                }
            }
        }

        return subcategories;
    }


    export function getRelationDefinitions(relationFields: Array<RelationDefinition>, categoryName: string,
                                           isRangeCategory: boolean = false, property?: string) {

        const availableRelationFields: Array<RelationDefinition> = [];
        for (let relationField of relationFields) {

            const categories: string[] = isRangeCategory ? relationField.range : relationField.domain;
            if (categories.indexOf(categoryName) > -1) {
                if (!property ||
                    (relationField as any)[property] == undefined ||
                    (relationField as any)[property] == true) {
                    availableRelationFields.push(relationField);
                }
            }
        }
        return availableRelationFields;
    }


    export function makeCategoriesMap(configuration: ConfigurationDefinition): Map<Category> {

        const [parentDefs, childDefs] =
            separate(on(CategoryDefinition.PARENT, isNot(defined)))(configuration.categories);

        const parentCategories = flow(
            parentDefs,
            map(Category.build),
            map(update('fields', Category.ifUndefinedSetGroupTo(Groups.PARENT))),
            makeLookup(Category.NAME)
        );

        return flow(
            childDefs,
            reduce(addChildCategory, parentCategories),
            flattenCategoriesTreeMapToCategoriesMap,
            fillGroups
        );
    }


    /**
     * Creates the groups array for each category.
     * @param categoriesMap modified in place
     */
    function fillGroups(categoriesMap: Map<Category>): Map<Category> {

        return map((category: Category) => {

            category.groups = flow(
                (category as any)['fields'],
                makeGroupsMap,
                map(sortGroupFields),
                convertToSortedArray(DEFAULT_GROUP_ORDER)
            );

            return category;

        })(categoriesMap);
    }


    // TODO make pure
    function sortGroupFields(group: Group) {

        group.fields = sortGroups(group.fields, group.name);
        return group;
    }


    function convertToSortedArray(defaultOrder: string[]) {

        return (groups: Map<Group>) => flow(
            defaultOrder,
            map(lookup(groups)),
            prune
        );
    }


    function makeGroupsMap(fields: Array<FieldDefinition>) {

        const groups: Map<Group> = {};
        for (let field of fields) {
            if (!groups[field.group]) groups[field.group] = { fields: [], name: field.group };
            groups[field.group].fields = groups[field.group].fields.concat(field);
        }
        return groups;
    }


    function flattenCategoriesTreeMapToCategoriesMap(categoriesMap: Map<Category>): Map<Category> {

        const topLevelCategories: Array<Category> = values(categoriesMap);
        const children: Array<Category> = flatten(topLevelCategories.map(to(Category.CHILDREN)));
        return makeLookup(Category.NAME)(topLevelCategories.concat(children))
    }


    function addChildCategory(categoriesMap: Map<Category>,
                              childDefinition: CategoryDefinition): Map<Category> {

        return flow(childDefinition.parent,
            lookup(categoriesMap),
            cond(
                isUndefined,
                throws(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC)
            ),
            addChildCategoryToParent(categoriesMap, childDefinition)
        );
    }


    function addChildCategoryToParent(categoriesMap: Map<Category>, childDefinition: CategoryDefinition) {

        return (parentCategory: Category): Map<Category> => {

            const childCategory = Category.build(childDefinition);
            (childCategory as any)['fields'] = Category.makeChildFields(parentCategory, childCategory);

            const newParentCategory: any
                = update(Category.CHILDREN, append(childCategory))(parentCategory as any);
            childCategory.parentCategory = newParentCategory;

            return assoc(parentCategory.name, newParentCategory)(categoriesMap);
        }
    }
}