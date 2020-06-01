import {cond, defined, flow, isNot, Map, Mapping, on,
    reduce, throws, isUndefined, copy, separate, dissoc} from 'tsfun';
import {assoc, update, lookup, map} from 'tsfun/associative';
import {Category} from '../model/category';
import {CategoryDefinition} from '../model/category-definition';
import {Group, Groups} from '../model/group';
import {makeLookup} from '../../util/transformers';
import {FieldDefinition} from '../model/field-definition';
import {clone} from '../../util/object-util';
import {mapToNamedArray, Named} from '../../util/named';
import {MDInternal} from '../../../components/messages/md-internal';
import {mapCategoriesTree} from './map-categories-tree';


const TEMP_FIELDS = 'fields';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function makeCategoriesTree(categories: any): Array<Category> {

    const [parentDefs, childDefs] =
        separate(on(CategoryDefinition.PARENT, isNot(defined)), categories);

    const parentCategories = flow(
        parentDefs,
        map(buildCategoryFromDefinition),
        map(update(TEMP_FIELDS, ifUndefinedSetGroupTo(Groups.PARENT))),
        makeLookup(Named.NAME)
    );

    return flow(
        childDefs,
        reduce(addChildCategory, parentCategories),
        mapToNamedArray,
        mapCategoriesTree(fillGroups),
        mapCategoriesTree(dissoc(TEMP_FIELDS)),
    );
}


/**
 * Creates the groups array for each category.
 */
function fillGroups(category: Category) {

    category.groups = flow(
        (category as any)[TEMP_FIELDS],
        makeGroupsMap,
        map(sortGroupFields) as any /* TODO review any */
    );

    return category;
}


function makeGroupsMap(fields: Array<FieldDefinition>): Map<Group> {

    const groups: Map<Group> = {};
    for (let field of fields) {
        if (!groups[field.group]) groups[field.group] = Group.create(field.group);
        groups[field.group].fields = groups[field.group].fields.concat(field);
    }

    return groups;
}


function addChildCategory(categoriesMap: Map<Category>, childDefinition: CategoryDefinition): Map<Category> {

    return flow(childDefinition.parent,
        lookup(categoriesMap),
        cond(
            isUndefined,
            throws(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC)
        ),
        addChildCategoryToParent(categoriesMap, childDefinition)
    );
}


function sortGroupFields(group: Group): Group {

    const clonedGroup: Group = clone(group);
    clonedGroup.fields = sortGroups(clonedGroup.fields, clonedGroup.name);

    return clonedGroup;
}


function addChildCategoryToParent(categoriesMap: Map<Category>, childDefinition: CategoryDefinition) {

    return (parentCategory: Category): Map<Category> => {

        const childCategory = buildCategoryFromDefinition(childDefinition);
        (childCategory as any)[TEMP_FIELDS] = makeChildFields(parentCategory, childCategory);

        parentCategory.children = parentCategory.children.concat(childCategory);
        childCategory.parentCategory = parentCategory;

        return categoriesMap;
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
    category.libraryId = definition.libraryId;

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


function getCombinedFields(parentFields: Array<FieldDefinition>,
                           childFields: Array<FieldDefinition>): Array<FieldDefinition> {

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


function sortGroups(fields: Array<FieldDefinition>, groupName: string): Array<FieldDefinition> {

    const copiedFields = copy(fields);

    switch(groupName) {
        case 'stem':
            sortGroup(copiedFields, [
                'identifier', 'shortDescription', 'supervisor', 'draughtsmen', 'processor', 'campaign',
                'diary', 'date', 'beginningDate', 'endDate'
            ]);
            break;
        case 'dimension':
            sortGroup(copiedFields, [
                'dimensionHeight', 'dimensionLength', 'dimensionWidth', 'dimensionPerimeter',
                'dimensionDiameter', 'dimensionThickness', 'dimensionVerticalExtent', 'dimensionOther'
            ]);
            break;
    }

    return copiedFields;
}


/**
 * Fields not defined via 'order' are not considered
 */
function sortGroup(fields: Array<FieldDefinition>, order: string[]) {

    fields.sort((field1: FieldDefinition, field2: FieldDefinition) => {
        return order.indexOf(field1.name) > order.indexOf(field2.name) ? 1 : -1;
    });
}
