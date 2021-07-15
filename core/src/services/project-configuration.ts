import { includedIn, on, Pair, isString } from 'tsfun';
import { Category, RelationDefinition, Document } from '../model';
import { Forest, isTopLevelItemOrChildThereof, Name, Tree } from '../tools';
import { ConfigurationErrors } from '../configuration/boot/configuration-errors';
import { RelationsUtil } from '../configuration/relations-utils';


export type RawProjectConfiguration = Pair<Forest<Category>, Array<RelationDefinition>>;


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
 * @author F.Z.
 */
export class ProjectConfiguration {

    private categories: Forest<Category>;
    
    private relations: Array<RelationDefinition>;


    constructor([categories, relations]: RawProjectConfiguration) {

        this.categories = categories;
        this.relations = relations || [];
    }


    public update(newProjectConfiguration: ProjectConfiguration) {

        this.categories = newProjectConfiguration.categories;
        this.relations = newProjectConfiguration.relations;
    }


    public getCategoryForest(...selectedTopLevelCategories: Array<Name>): Forest<Category> {

        return selectedTopLevelCategories.length === 0
            ? this.categories
            : this.categories.filter(
                on(Tree.ITEMNAMEPATH, includedIn(selectedTopLevelCategories)));
    }


    /**
     * @return Category, including children field
     */
    public getCategory(category: Name): Category|undefined;
    public getCategory(document: Document): Category|undefined
    public getCategory(arg) {

        const name = isString(arg) 
            ? (arg as Name) 
            : (arg as Document).resource.category;
        
        return Tree.find(this.categories, category => category.name === name)?.item;
    }


    public getRelations(): Array<RelationDefinition> {

        return this.relations;
    }


    public getRelationsForDomainCategory(categoryName: string): Array<RelationDefinition> {

        return RelationsUtil.getRelationDefinitions(this.relations, categoryName, false);
    }


    public getRelationsForRangeCategory(categoryName: string): Array<RelationDefinition> {

        return RelationsUtil.getRelationDefinitions(this.relations, categoryName, true);
    }


    /**
     * @returns {boolean} True if the given domain category is a valid domain name for a relation definition
     * which has the given range category & name
     */
    public isAllowedRelationDomainCategory(domainCategoryName: string, rangeCategoryName: string,
                                           relationName: string): boolean {

        const relationDefinitions = this.getRelationsForRangeCategory(rangeCategoryName);

        for (let relationDefinition of relationDefinitions) {
            if (relationName === relationDefinition.name
                && relationDefinition.domain.indexOf(domainCategoryName) > -1) return true;
        }

        return false;
    }


    public getAllowedRelationDomainCategories(relationName: string,
                                              rangeCategoryName: string): Array<Category> {

        return Tree.flatten(this.categories)
            .filter(category => {
                return this.isAllowedRelationDomainCategory(
                    category.name, rangeCategoryName, relationName
                ) && (!category.parentCategory || !this.isAllowedRelationDomainCategory(
                    category.parentCategory.name, rangeCategoryName, relationName
                ));
            });
    }


    public getAllowedRelationRangeCategories(relationName: string,
                                             domainCategoryName: string): Array<Category> {

        return Tree.flatten(this.categories)
            .filter(category => {
                return this.isAllowedRelationDomainCategory(
                    domainCategoryName, category.name, relationName
                ) && (!category.parentCategory || !this.isAllowedRelationDomainCategory(
                    domainCategoryName, category.parentCategory.name, relationName
                ));
            });
    }


    public getHierarchyParentCategories(categoryName: string): Array<Category> {

        return this.getAllowedRelationRangeCategories('isRecordedIn', categoryName)
            .concat(this.getAllowedRelationRangeCategories('liesWithin', categoryName));
    }


    public isSubcategory(category: Name, superCategoryName: string): boolean {

        if (!this.getCategory(category)) throw [ConfigurationErrors.UNKNOWN_CATEGORY_ERROR, category];
        return isTopLevelItemOrChildThereof(this.categories, category, superCategoryName);
    }
}
