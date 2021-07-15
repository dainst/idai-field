import { includedIn, on, Pair, isString, flow, map, filter, remove, is } from 'tsfun';
import { Category, RelationDefinition, Document } from '../model';
import { filterTrees, Forest, isTopLevelItemOrChildThereof, Name, Named, removeTrees, Tree } from '../tools';
import { ConfigurationErrors } from '../configuration/boot/configuration-errors';
import { RelationsUtil } from '../configuration/relations-utils';


export type RawProjectConfiguration = Pair<Forest<Category>, Array<RelationDefinition>>;

const TYPE_CATALOG = 'TypeCatalog';
const TYPE = 'Type';
const TYPE_CATALOG_AND_TYPE = [TYPE_CATALOG, TYPE];


/**
 * For naming of document types (for example "ConcreteField"-XYZ, "Image"-XYZ)
 * see document.ts
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


    public isGeometryCategory(category: Name): boolean {

        return !isTopLevelItemOrChildThereof(this.categories, category,
            'Image', 'Inscription', 'Type', 'TypeCatalog', 'Project');
    }


    // TODO remove; just return categories
    public getRegularCategoryNames(): Array<Name> {

        return flow(this.categories,
            removeTrees('Place', 'Project', TYPE_CATALOG, TYPE, 'Image', 'Operation'),
            Tree.flatten,
            map(Named.toName)
        );
    }


    public getConcreteFieldCategories(): Array<Category> {

        return flow(this.categories,
            removeTrees('Image', 'Project', TYPE_CATALOG, TYPE),
            Tree.flatten
        );
    }


    // TODO remove; just return categories
    public getConcreteFieldCategoryNames(): Array<Name> {

        return this.getConcreteFieldCategories().map(Named.toName);
    }


    public getFieldCategories(): Array<Category> {

        return flow(this.categories,
            removeTrees('Image', 'Project'),
            Tree.flatten
        );
    }


    // TODO remove; just return categories
    public getFieldCategoryNames(): Array<Name> {

        return this.getFieldCategories().map(Named.toName);
    }


    public getOverviewCategoryNames(): Array<Name> {

        return flow(this.categories,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            map(Named.toName)
        );
    }


    public getOverviewCategories(): Array<Name> {

        return flow(this.categories,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            remove(Named.onName(is('Operation'))), // TODO review why we do remove this here but not in getOverviewCategoryNames, compare also getOverviewToplevelCategories
            map(Named.toName) as any
        );
    }


    public getOverviewToplevelCategories(): Array<Category> {

        return flow(this.categories,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            filter(Named.onName(includedIn(['Operation', 'Place']))) as any
        );
    }


    public getTypeCategories(): Array<Category> {

        return flow(this.categories,
            filterTrees('Type', 'TypeCatalog'),
            Tree.flatten
        );
    }


    public getTypeCategoryNames(): Array<Name> {

        return TYPE_CATALOG_AND_TYPE;
    }


    public getImageCategoryNames(): Array<Name> {

        return flow(this.categories,
            filterTrees('Image'),
            Tree.flatten,
            map(Named.toName)
        );
    }


    public getFeatureCategoryNames(): string[] {

        return this.getSuperCategoryNames('Feature');
    }


    public getOperationCategoryNames(): string[] {

        return this.getSuperCategoryNames('Operation');
    }


    private getSuperCategoryNames(superCategoryName: string) {

        return flow(
            this.categories,
            filterTrees(superCategoryName),
            Tree.flatten,
            map(Named.toName));
    }
}
