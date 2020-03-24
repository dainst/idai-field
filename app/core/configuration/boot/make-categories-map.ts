import {
    append, assoc, cond, defined, dissoc, dissocOn, flatten, flow, isNot, lookup,
    map, Map, Mapping, on, prune, reduce, separate, throws, to, update, values
} from 'tsfun';
import {Category} from '../model/category';
import {CategoryDefinition} from '../model/category-definition';
import {DEFAULT_GROUP_ORDER, Group, Groups} from '../model/group';
import {makeLookup} from '../../util/utils';
import {FieldDefinition} from '../model/field-definition';
import {isUndefined} from 'tsfun/src/predicate';
import {MDInternal} from 'idai-components-2/index';
import {GroupUtil} from '../group-util';
import {clone} from '../../util/object-util';


const TEMP_FIELDS = 'fields';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function makeCategoriesMap(categories: any): Map<Category> {

    const [parentDefs, childDefs] =
        separate(on(CategoryDefinition.PARENT, isNot(defined)))(categories);

    const parentCategories = flow(
        parentDefs,
        map(buildCategoryFromDefinition),
        map(update(TEMP_FIELDS, ifUndefinedSetGroupTo(Groups.PARENT))),
        makeLookup(Category.NAME));

    return flow(
        childDefs,
        reduce(addChildCategory, parentCategories),
        flattenCategoriesTreeMapToCategoriesMap,
        fillGroups,
        map(dissoc(TEMP_FIELDS)),
        map(dissocOn([Category.PARENT_CATEGORY, TEMP_FIELDS])));
}


/**
 * Creates the groups array for each category.
 */
const fillGroups = map((category: Category) => {

        category.groups = flow(
            (category as any)[TEMP_FIELDS],
            makeGroupsMap,
            map(sortGroupFields),
            convertToSortedArray(DEFAULT_GROUP_ORDER)
        );

        return category;
    });


function makeGroupsMap(fields: Array<FieldDefinition>) {

    const groups: Map<Group> = {};
    for (let field of fields) {
        if (!groups[field.group]) groups[field.group] = { fields: [], name: field.group, label: '' };
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


// TODO make pure
function sortGroupFields(group: Group) {

    group.fields = GroupUtil.sortGroups(group.fields, group.name);
    return group;
}


function convertToSortedArray(defaultOrder: string[]) {

    return (groups: Map<Group>) => flow(
        defaultOrder,
        map(lookup(groups)),
        prune
    );
}


function addChildCategoryToParent(categoriesMap: Map<Category>, childDefinition: CategoryDefinition) {

    return (parentCategory: Category): Map<Category> => {

        const childCategory = buildCategoryFromDefinition(childDefinition);
        (childCategory as any)[TEMP_FIELDS] = makeChildFields(parentCategory, childCategory);

        const newParentCategory: any
            = update(Category.CHILDREN, append(childCategory))(parentCategory as any);
        childCategory.parentCategory = newParentCategory;

        return assoc(parentCategory.name, newParentCategory)(categoriesMap);
    }
}


function buildCategoryFromDefinition(definition: CategoryDefinition): Category {

    const category: any = {};
    category.mustLieWithin = definition.mustLieWithin;
    category.name = definition.name;
    category.label = definition.label || category.name;
    category.description = definition.description;
    category.groups = [];
    category.isAbstract = definition.abstract || false;
    category.color = definition.color ?? Category.generateColorForCategory(definition.name);
    category.children = [];

    category[TEMP_FIELDS] = definition.fields || [];
    return category as Category;
}


function makeChildFields(category: Category, child: Category): Array<FieldDefinition> {

    try {
        const childFields = ifUndefinedSetGroupTo(Groups.CHILD)((child as any)['fields']);
        return getCombinedFields((category as any)['fields'], childFields);
    } catch (e) {
        e.push(category.name);
        e.push(child.name);
        throw [e];
    }
}


function getCombinedFields(parentFields: Array<FieldDefinition>, childFields: Array<FieldDefinition>) {

    const fields: Array<FieldDefinition> = clone(parentFields);

    childFields.forEach(childField => {
        const field: FieldDefinition|undefined
            = fields.find(field => field.name === childField.name);

        if (field) {
            if (field.name !== 'campaign') {
                throw ['tried to overwrite field of parent category', field.name];
            }
        } else {
            fields.push(childField);
        }
    });

    return fields;
}


function ifUndefinedSetGroupTo(name: string): Mapping<Array<FieldDefinition>> {

    return map(
        cond(
            on(FieldDefinition.GROUP, isUndefined),
            assoc(FieldDefinition.GROUP, name)
        )
    ) as any;
}
