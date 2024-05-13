import { includedIn, on, isString, flow, filter, remove, is, Map, to } from 'tsfun';
import { filterTrees, Forest, isTopLevelItemOrChildThereof, Name, Named, removeTrees, Tree } from '../tools';
import { ConfigurationErrors } from '../configuration/boot/configuration-errors';
import { Category } from '../model/configuration/category';
import { CategoryForm } from '../model/configuration/category-form';
import { Relation } from '../model/configuration/relation';
import { Field } from '../model/configuration/field';
import { Document } from '../model/document';
import { Valuelist } from '../model';


export interface RawProjectConfiguration {
    forms: Forest<CategoryForm>;
    categories: Map<Category>;
    relations: Array<Relation>;
    commonFields: Map<Field>;
    valuelists: Map<Valuelist>;
    projectLanguages: string[];
};

const TYPE_CATALOG = 'TypeCatalog';
const TYPE = 'Type';


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

    private categoryForms: Forest<CategoryForm>;
    private relations: Array<Relation>;
    private projectLanguages: string[];

    private categoriesMap: Map<CategoryForm>;
    private regularCategories: Array<CategoryForm>;
    private fieldCategories: Array<CategoryForm>;
    private overviewCategories: Array<CategoryForm>;
    private concreteOverviewCategories: Array<CategoryForm>;
    private overviewSupercategories: Array<CategoryForm>;
    private typeManagementCategories: Array<CategoryForm>;
    private typeManagementSupercategories: Array<CategoryForm>;
    private typeCategories: Array<CategoryForm>;
    private categoriesWithSubcategories: Map<Array<CategoryForm>>;


    constructor(rawConfiguration: RawProjectConfiguration) {

        this.categoryForms = rawConfiguration.forms;
        this.relations = rawConfiguration.relations || [];
        this.projectLanguages = rawConfiguration.projectLanguages;
        this.categoriesMap = this.createCategoriesMap();
        this.updateFilteredCategories();
    }


    public update(newProjectConfiguration: ProjectConfiguration) {

        this.categoryForms = newProjectConfiguration.categoryForms;
        this.relations = newProjectConfiguration.relations;
        this.projectLanguages = newProjectConfiguration.projectLanguages;
        this.categoriesMap = this.createCategoriesMap();
        this.updateFilteredCategories();
    }


    public getProjectLanguages(): string[] {

        return this.projectLanguages;
    }


    // TODO allow also to pass in multiple Names and receive multiple Categories
    /**
     * @return Category, including children field
     */
    public getCategory(category: Name): CategoryForm|undefined;
    public getCategory(document: Document): CategoryForm|undefined
    public getCategory(arg) {
        
        if (arg === undefined) return undefined;

        const name: string = isString(arg) 
            ? (arg as Name) 
            : (arg as Document).resource.category;

        return this.categoriesMap[name];
    }


    public getCategories(...selectedTopLevelCategories: Array<Name>): Forest<CategoryForm> {

        return selectedTopLevelCategories.length === 0
            ? this.categoryForms
            : this.categoryForms.filter(
                on(Tree.ITEMNAMEPATH, includedIn(selectedTopLevelCategories)));
    }


    public getHierarchyParentCategories(categoryName: string): Array<CategoryForm> {

        return this.getAllowedRelationRangeCategories('isRecordedIn', categoryName)
            .concat(this.getAllowedRelationRangeCategories('liesWithin', categoryName));
    }


    public isSubcategory(category: Name, superCategoryName: string): boolean {

        if (!this.getCategory(category)) throw [ConfigurationErrors.UNKNOWN_CATEGORY_ERROR, category];
        return isTopLevelItemOrChildThereof(this.categoryForms, category, superCategoryName);
    }


    public isGeometryCategory(category: Name): boolean {

        return CategoryForm.getFields(this.getCategory(category))
            .map(to(Field.NAME))
            .includes('geometry');
    }


    public getRegularCategories(): Array<CategoryForm> {

        return this.regularCategories;
    }


    public getFieldCategories(): Array<CategoryForm> {

        return this.fieldCategories;
    }


    public getOverviewCategories(): Array<CategoryForm> {

        return this.overviewCategories;
    }


    public getConcreteOverviewCategories(): Array<CategoryForm> {

        return this.concreteOverviewCategories;
    }


    public getOverviewSupercategories(): Array<CategoryForm> {

        return this.overviewSupercategories;
    }


    public getTypeManagementCategories(): Array<CategoryForm> {

        return this.typeManagementCategories;
    }


    public getTypeManagementSupercategories(): Array<CategoryForm> {

        return this.typeManagementSupercategories;
    }


    public getTypeCategories(): Array<CategoryForm> {

        return this.typeCategories;
    }


    public getCategoryWithSubcategories(categoryName: string): Array<CategoryForm> {

        return this.categoriesWithSubcategories[categoryName] ?? [];
    }


    public getInventoryCategories(): Array<CategoryForm> {

        return this.getCategoryWithSubcategories('StoragePlace');
    }


    public getInventorySupercategories(): Array<CategoryForm> {

        return flow(this.getInventoryCategories(),
            filter(Named.onName(includedIn(['StoragePlace']))) as any
        );
    }


    public getImageCategories(): Array<CategoryForm> {

        return this.getCategoryWithSubcategories('Image');
    }


    public getFeatureCategories(): Array<CategoryForm> {

        return this.getCategoryWithSubcategories('Feature');
    }


    public getOperationCategories(): Array<CategoryForm> {

        return this.getCategoryWithSubcategories('Operation');
    }


    public getQrCodeCategories(): Array<CategoryForm> {

        return Tree.flatten(this.categoryForms)
            .filter(categoryForm => categoryForm.scanCodes !== undefined);
    }


    public getRelations(): Array<Relation> {

        return this.relations;
    }


    public getRelationsForDomainCategory(categoryName: string): Array<Relation> {

        return Relation.getRelations(this.relations, categoryName, false);
    }


    public getRelationsForRangeCategory(categoryName: string): Array<Relation> {

        return Relation.getRelations(this.relations, categoryName, true);
    }


    public isAllowedRelationDomainCategory(domainCategory: Name, 
                                           rangeCategory: Name,
                                           relation: Name): boolean {

        return Relation.isAllowedRelationDomainCategory(
            this.relations, domainCategory, rangeCategory, relation
        );
    }


    public getAllowedRelationDomainCategories(relationName: string,
                                              rangeCategoryName: string): Array<CategoryForm> {

        return Tree.flatten(this.categoryForms)
            .filter(category => {
                return Relation.isAllowedRelationDomainCategory(
                    this.relations, category.name, rangeCategoryName, relationName
                ) && (!category.parentCategory || !Relation.isAllowedRelationDomainCategory(
                    this.relations, category.parentCategory.name, rangeCategoryName, relationName
                ));
            });
    }


    public getAllowedRelationRangeCategories(relationName: string,
                                             domainCategoryName: string): Array<CategoryForm> {

        return Tree.flatten(this.categoryForms)
            .filter(category => {
                return Relation.isAllowedRelationDomainCategory(
                    this.relations, domainCategoryName, category.name, relationName
                ) && (!category.parentCategory || !Relation.isAllowedRelationDomainCategory(
                    this.relations, domainCategoryName, category.parentCategory.name, relationName
                ));
            });
    }


    private createCategoriesMap(): Map<CategoryForm> {

        return Tree.flatten(this.categoryForms)
            .reduce((result, category) => {
                result[category.name] = category;
                return result;
            }, {});
    }


    private updateFilteredCategories() {

        this.regularCategories = this.filterRegularCategories();
        this.fieldCategories = this.filterFieldCategories();
        this.overviewCategories = this.filterOverviewCategories();
        this.concreteOverviewCategories = this.filterConcreteOverviewCategories();
        this.overviewSupercategories = this.filterOverviewSupercategories();
        this.typeManagementCategories = this.filterTypeManagementCategories();
        this.typeManagementSupercategories = this.filterTypeManagementSupercategories();
        this.typeCategories = this.filterTypeCategories();
        this.categoriesWithSubcategories = this.filterCategoriesWithSubcategories();
    }


    private filterRegularCategories(): Array<CategoryForm> {

        return flow(this.categoryForms,
            removeTrees('Place', 'Project', TYPE_CATALOG, TYPE, 'StoragePlace', 'Image', 'Operation'),
            Tree.flatten
        );
    }


    private filterFieldCategories(): Array<CategoryForm> {

        return flow(this.categoryForms,
            removeTrees('Image', 'Project', TYPE_CATALOG, TYPE, 'StoragePlace'),
            Tree.flatten
        );
    }


    private filterOverviewCategories(): Array<CategoryForm> {

        return flow(this.categoryForms,
            filterTrees('Operation', 'Place'),
            Tree.flatten
        );
    }


    private filterConcreteOverviewCategories(): Array<CategoryForm> {

        return flow(this.categoryForms,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            remove(Named.onName(is('Operation')))
        ) as any;
    }


    private filterOverviewSupercategories(): Array<CategoryForm> {

        return flow(this.categoryForms,
            filterTrees('Operation', 'Place'),
            Tree.flatten,
            filter(Named.onName(includedIn(['Operation', 'Place']))) as any
        );
    }


    private filterTypeManagementCategories(): Array<CategoryForm> {

        return flow(this.categoryForms,
            filterTrees(TYPE, TYPE_CATALOG),
            Tree.flatten
        );
    }


    private filterTypeManagementSupercategories(): Array<CategoryForm> {

        return flow(this.filterTypeManagementCategories(),
            filter(Named.onName(includedIn([TYPE, TYPE_CATALOG]))) as any
        );
    }


    private filterTypeCategories(): Array<CategoryForm> {

        return flow(this.categoryForms,
            filterTrees(TYPE),
            Tree.flatten
        );
    }


    private filterCategoriesWithSubcategories(): Map<Array<CategoryForm>> {

        return Tree.flatten(this.categoryForms)
            .filter(category => !category.parentCategory)
            .reduce((result, category) => {
                result[category.name] = this.filterCategoryWithSubcategories(category.name);
                return result;
            }, {});
    }


    private filterCategoryWithSubcategories(categoryName: string): Array<CategoryForm> {

        return flow(this.categoryForms,
            filterTrees(categoryName),
            Tree.flatten
        );
    }
}
