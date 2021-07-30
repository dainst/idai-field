import { flow, on, separate, detach, map, reduce, clone, flatten, set, Map, values, isUndefined, compose } from 'tsfun';
import { Category, Field, Group, Groups, Relation, Resource } from '../../model';
import { Forest } from '../../tools';
import { linkParentAndChildInstances } from '../category-forest';
import { LibraryCategoryDefinition } from '../model';
import { TransientCategoryDefinition } from '../model/transient-category-definition';
import { ConfigurationErrors } from './configuration-errors';


const TEMP_FIELDS = 'fields';
const TEMP_GROUPS = 'tempGroups';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export const makeCategoryForest = (relationDefinitions: Array<Relation>, selectedParentCategories?: string[]) =>
        (categories: Map<TransientCategoryDefinition>): Forest<Category> => {

    const [parentDefs, childDefs] = flow(
        categories,
        values,
        separate(on(LibraryCategoryDefinition.PARENT, isUndefined))
    );

    const parentCategories = flow(
        parentDefs,
        map(buildCategoryFromDefinition),
        Forest.wrap
    );

    return flow(
        childDefs,
        reduce(addChildCategory(selectedParentCategories), parentCategories),
        Forest.map(
            compose(
                createGroups(relationDefinitions), 
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

    completeStemGroup(category);
    putCoreFieldsToHiddenGroup(category);

    return category;
}


function completeStemGroup(category: Category) {

    const fieldsInGroups: string[] = (flatten(1, category[TEMP_GROUPS].map(group => group.fields)) as string[]);
    const fieldsNotInGroups: Array<Field> = Object.keys(category[TEMP_FIELDS])
        .filter(fieldName => !fieldsInGroups.includes(fieldName)
            && (category[TEMP_FIELDS][fieldName].visible || category[TEMP_FIELDS][fieldName].editable))
        .map(fieldName => category[TEMP_FIELDS][fieldName]);

    if (fieldsNotInGroups.length === 0) return;

    let stemGroup: Group = category.groups.find(group => group.name === 'stem');
    if (!stemGroup) {
        stemGroup = Group.create('stem');
        category.groups.unshift(stemGroup);
    }

    stemGroup.fields = stemGroup.fields.concat(fieldsNotInGroups);
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


const addChildCategory = (selectedParentCategories?: string[]) =>
                            (categoryTree: Forest<Category>,
                             childDefinition: TransientCategoryDefinition): Forest<Category> => {

    const found = categoryTree.find(({ item: category }) => {
        return category.name === childDefinition.parent
            && (!selectedParentCategories || selectedParentCategories.includes(category.libraryId));
    });
    if (!found) return categoryTree;
    
    const { item: category, trees: trees } = found;

    const childCategory = buildCategoryFromDefinition(childDefinition);
    childCategory[TEMP_FIELDS] = makeChildFields(category, childCategory);

    trees.push({ item: childCategory, trees: [] });
    return categoryTree;
}


function buildCategoryFromDefinition(definition: TransientCategoryDefinition): Category {

    const def: any = definition;

    const category: any = {};
    category.mustLieWithin = def.mustLieWithin;
    category.name = def.name;
    category.libraryId = def.libraryId;
    category.label = def.label;
    category.source = def.source;
    category.description = def.description;
    category.defaultLabel = def.defaultLabel;
    category.defaultDescription = def.defaultDescription;
    category.groups = [];
    category.isAbstract = def.abstract || false;
    category.color = def.color ?? Category.generateColorForCategory(category.name);
    category.defaultColor = def.defaultColor ?? (category.libraryId
        ? Category.generateColorForCategory(def.name)
        : category.color
    );
    category.createdBy = def.createdBy;
    category.creationDate = def.creationDate ? new Date(def.creationDate) : undefined;
    category.children = [];
    category.userDefinedSubcategoriesAllowed = def.userDefinedSubcategoriesAllowed;
    category.required = def.required;

    category[TEMP_FIELDS] = def.fields || {};
    Object.keys(category[TEMP_FIELDS]).forEach(fieldName => category[TEMP_FIELDS][fieldName].name = fieldName);

    category[TEMP_GROUPS] = def.groups || [];

    return category as Category;
}


function makeChildFields(category: Category, child: Category): Array<Field> {

    try {
        const childFields = child[TEMP_FIELDS];
        return getCombinedFields(category[TEMP_FIELDS], childFields);
    } catch (errWithParams) {
        errWithParams.push(category.name);
        errWithParams.push(child.name)
        throw [errWithParams];
    }
}


function getCombinedFields(parentFields: Array<Field>,
                           childFields: Array<Field>): Array<Field> {

    const fields = clone(parentFields);

    Object.keys(childFields).forEach(fieldName => {
        if (fields[fieldName]) {
            if (fieldName !== 'campaign') {
                throw [
                    ConfigurationErrors.TRIED_TO_OVERWRITE_PARENT_FIELD,
                    fieldName
                ];
            }
        } else {
            fields[fieldName] = childFields[fieldName];
        }
    });

    return fields;
}
