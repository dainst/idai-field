import {cond, defined, flow, isNot, Map, Mapping, on, isUndefined, copy,
    separate, dissoc, map, update, reduce, map_a, values} from 'tsfun';
import {Category} from '../model/category';
import {CategoryDefinition} from '../model/category-definition';
import {Group, Groups} from '../model/group';
import {FieldDefinition} from '../model/field-definition';
import {clone} from '../../util/object-util';
import {mapToNamedArray, mapTreeList, TreeList} from '@idai-field/core';
import {MDInternal} from '../../../components/messages/md-internal';
import {linkParentAndChildInstances} from '../category-tree-list';
import {ConfigurationErrors} from './configuration-errors';


const TEMP_FIELDS = 'fields';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function makeCategoryTreeList(categories: any): TreeList<Category> {

    const [parentDefs, childDefs] =
        separate(on(CategoryDefinition.PARENT, isNot(defined)), categories);

    const parentCategories = flow(
        parentDefs,
        map_a(buildCategoryFromDefinition as any /* TODO review any*/),
        map_a(update(TEMP_FIELDS, ifUndefinedSetGroupTo(Groups.PARENT))) as any,
        mapToNamedArray,
        map(category => ({ item: category, trees: []}))
    );

    return flow(
        childDefs,
        values,
        reduce(addChildCategory, parentCategories),
        mapTreeList(fillGroups),
        mapTreeList(dissoc(TEMP_FIELDS)),
        linkParentAndChildInstances
    );
}


export const generateEmptyList = () => []; // to make sure getting a new instance every time this is called


/**
 * Creates the groups array for each category.
 */
function fillGroups(category: Category) {

    category.groups = flow(
        (category as any)[TEMP_FIELDS],
        makeGroupsMap,
        map(sortGroupFields) as any
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


function addChildCategory(categoryTree: TreeList<Category>,
                          childDefinition: CategoryDefinition): TreeList<Category> {

    const found = categoryTree
        .find(({ item: category }) => category.name === childDefinition.parent);
    if (!found) throw MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC;
    const { item: category, trees: trees } = found;

    const childCategory = buildCategoryFromDefinition(childDefinition);
    (childCategory as any)[TEMP_FIELDS] = makeChildFields(category, childCategory);

    trees.push({ item: childCategory, trees: []});
    return categoryTree;
}


function sortGroupFields(group: Group): Group {

    const clonedGroup: Group = clone(group);
    clonedGroup.fields = sortGroups(clonedGroup.fields, clonedGroup.name);

    return clonedGroup;
}



function buildCategoryFromDefinition(definition: CategoryDefinition): Category {

    const category: any = {};
    category.mustLieWithin = definition.mustLieWithin;
    category.name = definition.name;
    category.label = definition.label;
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
                throw [
                    ConfigurationErrors.TRIED_TO_OVERWRITE_PARENT_FIELD,
                    field.name
                ];
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
            update(FieldDefinition.GROUP, name)
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
