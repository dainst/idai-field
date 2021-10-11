import { flow, separate, detach, map, reduce, flatten, set, Map, values, compose } from 'tsfun';
import { Category } from '../../model/configuration/category';
import { Field } from '../../model/configuration/field';
import { Group, Groups } from '../../model/configuration/group';
import { Relation } from '../../model/configuration/relation';
import { Resource } from '../../model/resource';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { Forest } from '../../tools/forest';
import { linkParentAndChildInstances } from '../category-forest';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';


const TEMP_FIELDS = 'fields';
const TEMP_GROUPS = 'tempGroups';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export const makeCategoryForest = (relations: Array<Relation>, categories: Map<TransientCategoryDefinition>,
                                   selectedParentCategories?: string[]) =>
        (forms: Map<TransientFormDefinition>): Forest<Category> => {

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
        reduce(addChildCategory(categories, selectedParentCategories), parentCategories),
        Forest.map(
            compose(
                createGroups(relations), 
                detach(TEMP_FIELDS), 
                detach(TEMP_GROUPS)
            )
        ),
        linkParentAndChildInstances
    );
}


const createGroups = (relationDefinitions: Array<Relation>) => (category: Category): Category => {

    const categoryRelations: Array<Relation> = Relation.getRelations(
        relationDefinitions, category.name
    );

    category.groups = category[TEMP_GROUPS].map(groupDefinition => {
        const group = Group.create(groupDefinition.name);
        group.fields = set(groupDefinition.fields)
            .map(fieldName => {
                return category[TEMP_FIELDS][fieldName]
                    ?? categoryRelations.find(relation => relation.name === fieldName)
            })
            .filter(field => field !== undefined)
        return group;
    });

    putUnassignedFieldsToOtherGroup(category);
    putCoreFieldsToHiddenGroup(category);

    return category;
}


function putUnassignedFieldsToOtherGroup(category: Category) {

    const fieldsInGroups: string[] = (flatten(1, category[TEMP_GROUPS].map(group => group.fields)) as string[]);
    const fieldsNotInGroups: Array<Field> = Object.keys(category[TEMP_FIELDS])
        .filter(fieldName => !fieldsInGroups.includes(fieldName)
            && (category[TEMP_FIELDS][fieldName].visible || category[TEMP_FIELDS][fieldName].editable))
        .map(fieldName => category[TEMP_FIELDS][fieldName]);

    if (fieldsNotInGroups.length === 0) return;

    let otherGroup: Group = category.groups.find(group => group.name === Groups.OTHER);
    if (!otherGroup) {
        otherGroup = Group.create(Groups.OTHER);
        category.groups.push(otherGroup);
    }

    otherGroup.fields = otherGroup.fields.concat(fieldsNotInGroups);
}


function putCoreFieldsToHiddenGroup(category: Category) {

    if (!category[TEMP_FIELDS][Resource.ID]) return;

    category.groups.push({
        name: Groups.HIDDEN_CORE_FIELDS,
        fields: [
            category[TEMP_FIELDS][Resource.ID]
        ]
    });
}


const addChildCategory = (categories: Map<TransientCategoryDefinition>, selectedParentCategories?: string[]) =>
                            (categoryTree: Forest<Category>,
                             childDefinition: TransientFormDefinition): Forest<Category> => {

    const parent: string = childDefinition.parent ?? categories[childDefinition.categoryName]?.parent;

    const found = categoryTree.find(({ item: category }) => {
        return category.name === parent
            && (!selectedParentCategories || selectedParentCategories.includes(category.libraryId));
    });
    if (!found) return categoryTree;
    
    const { item: _, trees: trees } = found;

    const childCategory = buildCategoryFromDefinition(categories)(childDefinition);
    trees.push({ item: childCategory, trees: [] });

    return categoryTree;
}


function buildCategoryFromDefinition(categories: Map<TransientCategoryDefinition>) {

    return function(formDefinition: TransientFormDefinition): Category {

        const categoryDefinition: TransientCategoryDefinition|undefined = categories[formDefinition.categoryName];
        const parentCategoryDefinition: TransientCategoryDefinition
            = categories[formDefinition.parent ?? categoryDefinition.parent];
        const category: any = {};

        category.name = categoryDefinition ? categoryDefinition.name : formDefinition.categoryName;
        category.mustLieWithin = categoryDefinition
            ? categoryDefinition.mustLieWithin : parentCategoryDefinition.mustLieWithin;
        category.isAbstract = categoryDefinition?.abstract || false;
        category.userDefinedSubcategoriesAllowed = categoryDefinition?.userDefinedSubcategoriesAllowed || false;
        category.required = categoryDefinition?.required || false;

        category.libraryId = formDefinition.name;
        category.label = formDefinition.label;
        category.source = formDefinition.source;
        category.description = formDefinition.description;
        category.defaultLabel = formDefinition.defaultLabel;
        category.defaultDescription = formDefinition.defaultDescription;
        category.groups = [];
            category.color = formDefinition.color ?? Category.generateColorForCategory(category.name);
        category.defaultColor = formDefinition.defaultColor ?? (category.libraryId
            ? Category.generateColorForCategory(category.name)
            : category.color
        );
        category.createdBy = formDefinition.createdBy;
        category.creationDate = formDefinition.creationDate ? new Date(formDefinition.creationDate) : undefined;
        
        category.children = [];
        category[TEMP_FIELDS] = formDefinition.fields || {};
        Object.keys(category[TEMP_FIELDS]).forEach(fieldName => category[TEMP_FIELDS][fieldName].name = fieldName);
        category[TEMP_GROUPS] = formDefinition.groups || [];

        return category as Category;
    }
}
