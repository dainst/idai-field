import { flow, separate, detach, map, reduce, flatten, set, Map, values, compose, clone, to } from 'tsfun';
import { CategoryForm } from '../../model/configuration/category-form';
import { Field } from '../../model/configuration/field';
import { Group, Groups } from '../../model/configuration/group';
import { Relation } from '../../model/configuration/relation';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { Forest } from '../../tools/forest';
import { linkParentAndChildInstances } from '../category-forest';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { applyHiddenForFields } from './hide-fields';
import { Named } from '../../tools/named';


const TEMP_FIELDS = 'fields';
const TEMP_GROUPS = 'tempGroups';
const TEMP_HIDDEN = 'hidden';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export const makeCategoryForest = (relations: Array<Relation>, categories: Map<TransientCategoryDefinition>,
                                   selectedParentForms?: string[], includeAllRelations: boolean = false) =>
        (forms: Map<TransientFormDefinition>): Forest<CategoryForm> => {

    const [parentDefs, childDefs] = flow(
        forms,
        values,
        separate(form => !form.parent && !categories[form.categoryName].parent)
    );

    const parentCategories = flow(
        parentDefs,
        map(buildCategoryFromDefinition(categories)),
        Forest.wrap
    );

    return flow(
        childDefs,
        reduce(addChildCategory(categories, selectedParentForms), parentCategories),
        Forest.map(
            compose(
                createGroups(relations, includeAllRelations), 
                detach(TEMP_FIELDS), 
                detach(TEMP_GROUPS),
                detach(TEMP_HIDDEN)
            )
        ),
        linkParentAndChildInstances
    );
}


const createGroups = (relationDefinitions: Array<Relation>, includeAllRelations: boolean) =>
        (category: CategoryForm): CategoryForm => {

    const categoryRelations: Array<Relation> = clone(Relation.getRelations(relationDefinitions, category.name));
    applyHiddenForFields(categoryRelations, category[TEMP_HIDDEN]);

    const fields: Map<Field> = combineFieldsWithRelations(category, categoryRelations);

    category.groups = category[TEMP_GROUPS].map(groupDefinition => {
        const group = Group.create(groupDefinition.name);
        group.fields = set(groupDefinition.fields)
            .map((fieldName: string) => fields[fieldName])
            .filter(field => field !== undefined);
        return group;
    });

    if (includeAllRelations && category.groups.length > 0) {
        addAllRelationsToGroups(category, categoryRelations);
    }

    putUnassignedFieldsToGroups(category, fields);

    return category;
}


function combineFieldsWithRelations(category: CategoryForm, categoryRelations: Array<Relation>): Map<Field> {

    let fields: Map<Field> = {};
    Object.assign(fields, category[TEMP_FIELDS]);
    fields = categoryRelations.reduce((result, relation) => {
        result[relation.name] = relation;
        return result;
    }, fields);

    return fields;
}


function addAllRelationsToGroups(category: CategoryForm, categoryRelations: Array<Relation>) {

    categoryRelations.filter(relation => {
        return !flatten(category.groups.map(to(Group.FIELDS)))
            .map(to(Named.NAME))
            .includes(relation.name);
    }).forEach(relation => {
        category.groups[0].fields.push(relation);
    });
}


function putUnassignedFieldsToGroups(category: CategoryForm, fields: Map<Field>) {

    const fieldsInGroups: string[] = (flatten(1, category[TEMP_GROUPS].map(group => group.fields)) as string[]);

    Object.values(fields)
        .filter(field => !fieldsInGroups.includes(field.name)
            && (fields[field.name].visible || fields[field.name].editable))
        .forEach(field => putUnassignedFieldToGroup(category, field));
}


function putUnassignedFieldToGroup(category: CategoryForm, field: Field) {

    const groupName: string = getGroupNameForUnassaginedField(field.name);
        
    let group: Group = category.groups.find(group => group.name === groupName);
    if (!group) {
        group = Group.create(groupName);
        category.groups.push(group);
    }

    group.fields.push(field);
}


function getGroupNameForUnassaginedField(fieldName: string): string {

    if (Relation.Position.ALL.includes(fieldName)) {
        return Groups.POSITION;
    } else if (Relation.Time.ALL.includes(fieldName)) {
        return Groups.TIME;
    } else if (Relation.Type.ALL.includes(fieldName)) {
        return Groups.IDENTIFICATION;
    } else {
        return Groups.OTHER;
    }
}


const addChildCategory = (categories: Map<TransientCategoryDefinition>, selectedParentForms?: string[]) =>
                            (categoryTree: Forest<CategoryForm>,
                             childDefinition: TransientFormDefinition): Forest<CategoryForm> => {

    const parent: string = childDefinition.parent ?? categories[childDefinition.categoryName]?.parent;

    const found = categoryTree.find(({ item: category }) => {
        return category.name === parent
            && (!selectedParentForms || selectedParentForms.includes(category.libraryId));
    });
    if (!found) return categoryTree;
    
    const { item: _, trees: trees } = found;

    const childCategory = buildCategoryFromDefinition(categories)(childDefinition);
    trees.push({ item: childCategory, trees: [] });

    return categoryTree;
}


function buildCategoryFromDefinition(categories: Map<TransientCategoryDefinition>) {

    return function(formDefinition: TransientFormDefinition): CategoryForm {

        const categoryDefinition: TransientCategoryDefinition|undefined = categories[formDefinition.categoryName];
        const parentCategoryDefinition: TransientCategoryDefinition
            = categories[formDefinition.parent ?? categoryDefinition.parent];
        const category: any = {};

        category.name = categoryDefinition ? categoryDefinition.name : formDefinition.categoryName;
        category.mustLieWithin = parentCategoryDefinition
            ? parentCategoryDefinition.mustLieWithin : categoryDefinition.mustLieWithin;
        category.isAbstract = categoryDefinition?.abstract || false;
        category.userDefinedSubcategoriesAllowed = categoryDefinition?.userDefinedSubcategoriesAllowed || false;
        category.required = categoryDefinition?.required || false;

        category.libraryId = formDefinition.name;
        category.label = formDefinition.label;
        category.categoryLabel = categoryDefinition ? categoryDefinition.label : clone(formDefinition.label);
        category.source = formDefinition.source;
        category.customFields = formDefinition.customFields;
        category.description = formDefinition.description;
        category.defaultLabel = formDefinition.defaultLabel;
        category.defaultDescription = formDefinition.defaultDescription;
        category.groups = [];
            category.color = formDefinition.color ?? CategoryForm.generateColorForCategory(category.name);
        category.defaultColor = formDefinition.defaultColor ?? (category.libraryId
            ? CategoryForm.generateColorForCategory(category.name)
            : category.color
        );
        category.identifierPrefix = formDefinition.identifierPrefix;
        category.resourceLimit = formDefinition.resourceLimit;
        category.useScanCode = formDefinition.useScanCode;
        category.createdBy = formDefinition.createdBy;
        category.creationDate = formDefinition.creationDate ? new Date(formDefinition.creationDate) : undefined;
        category.references = formDefinition.references;
        
        category.children = [];
        category[TEMP_FIELDS] = formDefinition.fields || {};
        Object.keys(category[TEMP_FIELDS]).forEach(fieldName => category[TEMP_FIELDS][fieldName].name = fieldName);
        category[TEMP_GROUPS] = formDefinition.groups || [];
        category[TEMP_HIDDEN] = formDefinition.hidden || [];

        return category as CategoryForm;
    }
}
