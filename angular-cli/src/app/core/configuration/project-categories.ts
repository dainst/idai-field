import {Injectable} from '@angular/core';
import {to, isnt} from 'tsfun';
import {ProjectConfiguration} from './project-configuration';
import {Category} from './model/category';

const NAME = 'name';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class ProjectCategories {

    public static UNKNOWN_TYPE_ERROR = 'projectCategories.Errors.UnknownType';

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public getOverviewTopLevelCategories(): Array<Category> {

        return this.projectConfiguration.getCategoriesArray()
            .filter(category => category.name === 'Operation' || category.name === 'Place');
    }


    public getFieldCategories(): Array<Category> {

        return this.projectConfiguration.getCategoriesArray()
            .filter(category => !this.projectConfiguration.isSubcategory(category.name, 'Image'))
            .filter(category => !ProjectCategories.isProjectCategory(category.name));
    }


    public getConcreteFieldCategories(): Array<Category> {

        return this.projectConfiguration.getCategoriesArray()
            .filter(category => !this.projectConfiguration.isSubcategory(category.name, 'Image'))
            .filter(category => !this.projectConfiguration.isSubcategory(category.name, 'TypeCatalog'))
            .filter(category => !this.projectConfiguration.isSubcategory(category.name, 'Type'))
            .filter(category => !ProjectCategories.isProjectCategory(category.name));
    }


    public getAbstractFieldCategories(): Array<Category> {

        return this.projectConfiguration.getCategoriesArray()
            .filter(category => category.name === 'TypeCatalog' || category.name === 'Type');
    }


    public getNamesOfCategoriesAndSubcategories(supercategoryName: string): string[] {

        return Object.keys(this.projectConfiguration.getCategoryAndSubcategories(supercategoryName));
    }


    public getFieldCategoryNames(): string[] {

        return this.getFieldCategories().map(to(NAME));
    }


    public getConcreteFieldCategoryNames(): string[] {

        return this.getConcreteFieldCategories().map(to(NAME));
    }


    public getAbstractFieldCategoryNames(): string[] {

        return this.getAbstractFieldCategories().map(to(NAME));
    }


    public getImageCategoryNames(): string[] {

        return Object.keys(this.projectConfiguration.getCategoryAndSubcategories('Image'));
    }


    public getFeatureCategoryNames(): string[] {

        return Object.keys(this.projectConfiguration.getCategoryAndSubcategories('Feature'));
    }


    public getOperationCategoryNames(): string[] {

        return Object.keys(this.projectConfiguration.getCategoryAndSubcategories('Operation'));
    }


    public getRegularCategoryNames(): string[] {

        return this.projectConfiguration
            .getCategoriesArray()
            .map(to(NAME))
            .filter(isnt('Place'))
            .filter(isnt('Project'))
            .filter(categoryName => !this.projectConfiguration.isSubcategory(categoryName, 'Operation'))
            .filter(categoryName => !this.projectConfiguration.isSubcategory(categoryName, 'Image'))
            .filter(categoryName => !this.projectConfiguration.isSubcategory(categoryName, 'TypeCatalog'))
            .filter(categoryName => !this.projectConfiguration.isSubcategory(categoryName, 'Type'));
    }


    public getOverviewCategoryNames(): string[] {

        return this.projectConfiguration
            .getCategoriesArray()
            .map(to(NAME))
            .filter(categoryName => this.projectConfiguration.isSubcategory(categoryName, 'Operation'))
            .concat('Place');
    }


    public getAllowedRelationDomainCategories(relationName: string,
                                              rangeCategoryName: string): Array<Category> {

        return this.projectConfiguration.getCategoriesArray()
            .filter(category => {
                return this.projectConfiguration.isAllowedRelationDomainCategory(
                    category.name, rangeCategoryName, relationName
                ) && (!category.parentCategory || !this.projectConfiguration.isAllowedRelationDomainCategory(
                    category.parentCategory.name, rangeCategoryName, relationName
                ));
            });
    }


    public getAllowedRelationRangeCategories(relationName: string,
                                             domainCategoryName: string): Array<Category> {

        return this.projectConfiguration.getCategoriesArray()
            .filter(category => {
                return this.projectConfiguration.isAllowedRelationDomainCategory(
                    domainCategoryName, category.name, relationName
                ) && (!category.parentCategory || !this.projectConfiguration.isAllowedRelationDomainCategory(
                    domainCategoryName, category.parentCategory.name, relationName
                ));
            });
    }


    public getHierarchyParentCategories(categoryName: string): Array<Category> {

        return this.getAllowedRelationRangeCategories('isRecordedIn', categoryName)
            .concat(this.getAllowedRelationRangeCategories('liesWithin', categoryName));
    }


    public isGeometryCategory(categoryName: string): boolean {

        return !this.getImageCategoryNames().includes(categoryName)
            && !this.projectConfiguration.isSubcategory(categoryName, 'Inscription')
            && !this.projectConfiguration.isSubcategory(categoryName, 'Type')
            && !this.projectConfiguration.isSubcategory(categoryName, 'TypeCatalog')
            && !ProjectCategories.isProjectCategory(categoryName);
    }


    public getOverviewCategories(): string[] {

        return Object.keys(this.projectConfiguration.getCategoryAndSubcategories('Operation'))
            .concat(['Place'])
            .filter(el => el !== 'Operation');
    }


    public getTypeCategories(): string[] {

        return Object.keys(this.projectConfiguration.getCategoryAndSubcategories('TypeCatalog'))
            .concat(Object.keys(this.projectConfiguration.getCategoryAndSubcategories('Type')));
    }


    private static isProjectCategory(categoryName: string): boolean {

        return categoryName === 'Project';
    }
}