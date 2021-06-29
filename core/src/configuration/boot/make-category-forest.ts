import { isDefined, flow, on, separate, detach, map, reduce, clone, not, flatten, set } from 'tsfun';
import { Category, CategoryDefinition, FieldDefinition, Group, Resource } from '../../model';
import { Forest, Named, Tree } from '../../tools';
import { linkParentAndChildInstances } from '../category-forest';
import { ConfigurationErrors } from './configuration-errors';


const TEMP_FIELDS = 'fields';
const TEMP_GROUPS = 'tempGroups';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function makeCategoryForest(categories: any): Forest<Category> {

    const [parentDefs, childDefs] =
        separate<CategoryDefinition>(on(CategoryDefinition.PARENT, not(isDefined)), categories);

    const parentCategories = flow(
        parentDefs,
        map(buildCategoryFromDefinition),
        Named.mapToNamedArray as any,
        map(category => ({ item: category, trees: []}))
    );

    return flow(
        childDefs,
        reduce(addChildCategory, parentCategories as any),
        Tree.mapList(createGroups),
        Tree.mapList(detach(TEMP_FIELDS)),
        Tree.mapList(detach(TEMP_GROUPS)),
        linkParentAndChildInstances
    );
}


export const generateEmptyList = () => []; // to make sure getting a new instance every time this is called


function createGroups(category: Category): Category {

    category.groups = category[TEMP_GROUPS].map(groupDefinition => {
        const group = Group.create(groupDefinition.name);
        group.fields = set(groupDefinition.fields)
            .map(fieldName => category[TEMP_FIELDS][fieldName])
            .filter(field => field !== undefined)
        return group;
    });

    let stemGroup: Group = category.groups.find(group => group.name === 'stem');
    if (!stemGroup) {
        stemGroup = Group.create('stem');
        category.groups.unshift(stemGroup);
    }

    const fieldsInGroups: string[] = (flatten(1, category[TEMP_GROUPS].map(group => group.fields)) as string[])

    if (category[TEMP_FIELDS][Resource.CATEGORY]) {
        stemGroup.fields.unshift(category[TEMP_FIELDS][Resource.CATEGORY]);
        fieldsInGroups.push(Resource.CATEGORY);
    }

    const fieldsNotInGroups: Array<FieldDefinition> = Object.keys(category[TEMP_FIELDS])
        .filter(fieldName => !fieldsInGroups.includes(fieldName))
        .map(fieldName => category[TEMP_FIELDS][fieldName]);

    stemGroup.fields = stemGroup.fields.concat(fieldsNotInGroups);

    return category;
}


function addChildCategory(categoryTree: Forest<Category>,
                          childDefinition: CategoryDefinition): Forest<Category> {

    const found = categoryTree
        .find(({ item: category }) => category.name === childDefinition.parent);
    if (!found) throw 'project configuration error generic'; // TODO replace MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC;
    const { item: category, trees: trees } = found;

    const childCategory = buildCategoryFromDefinition(childDefinition);
    (childCategory as any)[TEMP_FIELDS] = makeChildFields(category, childCategory);

    trees.push({ item: childCategory, trees: [] });
    return categoryTree;
}


function buildCategoryFromDefinition(definition: CategoryDefinition): Category {

    const category: any = {};
    category.mustLieWithin = definition.mustLieWithin;
    category.name = definition.name;
    category.label = definition.label;
    category.description = definition.description;
    category.defaultLabel = definition.defaultLabel;
    category.defaultDescription = definition.defaultDescription;
    category.groups = [];
    category.isAbstract = definition.abstract || false;
    category.color = definition.color ?? Category.generateColorForCategory(definition.name);
    category.defaultColor = definition.defaultColor ?? Category.generateColorForCategory(definition.name);
    category.children = [];
    category.libraryId = definition.libraryId;
    category.userDefinedSubcategoriesAllowed = definition.userDefinedSubcategoriesAllowed;

    category[TEMP_FIELDS] = definition.fields || {};
    Object.keys(category[TEMP_FIELDS]).forEach(fieldName => category[TEMP_FIELDS][fieldName].name = fieldName);

    category[TEMP_GROUPS] = definition.groups || [];

    return category as Category;
}


function makeChildFields(category: Category, child: Category): Array<FieldDefinition> {

    try {
        const childFields = child[TEMP_FIELDS];
        return getCombinedFields(category[TEMP_FIELDS], childFields);
    } catch (errWithParams) {
        errWithParams.push(category.name);
        errWithParams.push(child.name)
        throw [errWithParams];
    }
}


function getCombinedFields(parentFields: Array<FieldDefinition>,
                           childFields: Array<FieldDefinition>): Array<FieldDefinition> {

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
