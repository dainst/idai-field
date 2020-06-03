import {flow, to, on, isNot, empty, is, isUndefined, Pair, Map} from 'tsfun';
import {map} from 'tsfun/associative';
import {filter} from 'tsfun/collection';
import {Category} from './model/category';
import {FieldDefinition} from './model/field-definition';
import {RelationDefinition} from './model/relation-definition';
import {Named, namedArrayToNamedMap} from '../util/named';
import {RelationsUtil} from './relations-utils';
import {ProjectCategoriesHelper} from './project-categories-helper';
import {Tree} from './tree';
import {treeToCategoryArray} from './category-tree';


export type RawProjectConfiguration = Pair<Tree<Category>, Array<RelationDefinition>>;


/**
 * ProjectConfiguration maintains the current projects properties.
 * Amongst them is the set of categories for the current project,
 * which ProjectConfiguration provides to its clients.
 *
 * Within a project, objects of the available categories can get created,
 * where every name is a configuration of different fields.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ProjectConfiguration {

    private categoriesArray: Array<Category>;

    private categoriesMap: Map<Category>;

    private categoryTree: Tree<Category>;

    private relations: Array<RelationDefinition>;


    constructor([categories, relations]: RawProjectConfiguration) {

        // console.log('categories', categories); TODO if this is enabled, we see output in tests not enabled with fit, which means usually that we have code running outside describe blocks

        this.categoryTree = categories;
        this.categoriesArray = treeToCategoryArray(categories) || [];
        this.relations = relations || [];
        this.categoriesMap = namedArrayToNamedMap(treeToCategoryArray(categories));
    }


    public getAllRelationDefinitions(): Array<RelationDefinition> {

        return this.relations;
    }


    public getCategoriesArray(): Array<Category> {

        return this.categoriesArray;
    }


    // TODO introduce getCategory(name: Name) instead of accessing it by key after calling getCategoriesMap
    public getCategoriesMap(): Map<Category> {

        return this.categoriesMap;
    }


    // TODO use in project-configuration.component instead of building a treeList there
    public getCategoryTree(): Tree<Category> {

        return this.categoryTree;
    }


    // TODO deprecated, use functions above
    // this here it seems we use only to access 'Image', which can be done via getCategoriesMap
    public getCategoriesTree(): Map<Category> {

        return filter(on(Category.PARENT_CATEGORY, isUndefined), this.getCategoriesMap());
    }


    public getCategoryAndSubcategories(supercategoryName: string): Map<Category> {

        return ProjectCategoriesHelper.getCategoryAndSubcategories(supercategoryName, this.getCategoriesMap());
    }


    /**
     * Gets the relation definitions available.
     *
     * @param categoryName the name of the category to get the relation definitions for.
     * @param isRangeCategory If true, get relation definitions where the given category is part of the relation's
     * range (instead of domain)
     * @param property to give only the definitions with a certain boolean property not set or set to true
     * @returns {Array<RelationDefinition>} the definitions for the category.
     */
    public getRelationDefinitions(categoryName: string, isRangeCategory: boolean = false,
                                  property?: string): Array<RelationDefinition> {

        return RelationsUtil.getRelationDefinitions(this.relations, categoryName, isRangeCategory, property);
    }

    /**
     * @returns {boolean} True if the given domain category is a valid domain name for a relation definition
     * which has the given range category & name
     */
    public isAllowedRelationDomainCategory(domainCategoryName: string, rangeCategoryName: string,
                                           relationName: string): boolean {

        const relationDefinitions = this.getRelationDefinitions(rangeCategoryName, true);

        for (let relationDefinition of relationDefinitions) {
            if (relationName === relationDefinition.name
                && relationDefinition.domain.indexOf(domainCategoryName) > -1) return true;
        }

        return false;
    }


    public isSubcategory(categoryName: string, superCategoryName: string): boolean {

        return ProjectCategoriesHelper.isSubcategory(this.getCategoriesMap(), categoryName, superCategoryName);
    }

    /**
     * @param categoryName
     * @returns {any[]} the fields definitions for the category.
     */
    public getFieldDefinitions(categoryName: string): FieldDefinition[] {

        if (!this.getCategoriesMap()[categoryName]) return [];
        return Category.getFields(this.getCategoriesMap()[categoryName]);
    }


    public getLabelForCategory(categoryName: string): string {

        if (!this.getCategoriesMap()[categoryName]) return '';
        return this.getCategoriesMap()[categoryName].label;
    }


    public getColorForCategory(categoryName: string): string {

        return this.getCategoryColors()[categoryName];
    }


    public getTextColorForCategory(categoryName: string): string {

        return Category.isBrightColor(this.getColorForCategory(categoryName)) ? '#000000' : '#ffffff';
    }


    public getCategoryColors() {

        return map(to(Category.COLOR))(this.getCategoriesMap()) as Map<string>;
    }


    public isMandatory(categoryName: string, fieldName: string): boolean {

        return this.hasProperty(categoryName, fieldName, FieldDefinition.MANDATORY);
    }


    /**
     * Should be used only from within components.
     *
     * @param relationName
     * @returns {string}
     */
    public getRelationDefinitionLabel(relationName: string): string {

        return Category.getLabel(relationName, this.relations);
    }


    /**
     * Gets the label for the field if it is defined.
     * Otherwise it returns the fields definitions name.
     *
     * @param categoryName
     * @param fieldName
     * @returns {string}
     * @throws {string} with an error description in case the category is not defined.
     */
    public getFieldDefinitionLabel(categoryName: string, fieldName: string): string {

        const fieldDefinitions = this.getFieldDefinitions(categoryName);
        if (fieldDefinitions.length === 0) {
            throw 'No category definition found for category \'' + categoryName + '\'';
        }

        return Category.getLabel(fieldName, fieldDefinitions);
    }


    private hasProperty(categoryName: string, fieldName: string, propertyName: string) {

        if (!this.getCategoriesMap()[categoryName]) return false;

        return flow(
            Category.getFields(this.getCategoriesMap()[categoryName]),
            filter(on(Named.NAME, is(fieldName))),
            filter(on(propertyName, is(true))),
            isNot(empty));
    }
}
