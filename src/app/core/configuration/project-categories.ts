import {Injectable} from '@angular/core';
import {to} from 'tsfun';
import {ProjectConfiguration} from './project-configuration';
import {Category} from './model/category';
import {ProjectCategoriesHelper, TYPE, TYPE_CATALOG, TYPE_CATALOG_AND_TYPE} from './project-categories-helper';

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

        return ProjectCategoriesHelper.getFieldCategories(this.projectConfiguration.getCategoriesMap());
    }


    public getConcreteFieldCategories(): Array<Category> {

        return ProjectCategoriesHelper.getConcreteFieldCategories(this.projectConfiguration.getCategoriesMap());
    }


    public getTypeCategories(): Array<Category> {

        return this.projectConfiguration.getCategoriesArray()
            .filter(category => category.name === TYPE_CATALOG || category.name === TYPE);
    }


    public getTypeCategoryNames(): string[] {

        return TYPE_CATALOG_AND_TYPE;
    }


    public getFieldCategoryNames(): string[] {

        return this.getFieldCategories().map(to(NAME));
    }


    public getConcreteFieldCategoryNames(): string[] {

        return this.getConcreteFieldCategories().map(to(NAME));
    }


    public getImageCategoryNames(): string[] {

        return ProjectCategoriesHelper.getImageCategoryNames(this.projectConfiguration.getCategoriesMap());
    }


    public getFeatureCategoryNames(): string[] {

        return this.getSuperCategoryNames('Feature');
    }


    public getOperationCategoryNames(): string[] {

        return this.getSuperCategoryNames('Operation');
    }


    public getNamesOfCategoriesAndSubcategories(supercategoryName: string): string[] {

        return this.getSuperCategoryNames(supercategoryName);
    }


    public getRegularCategoryNames(): string[] {

        return ProjectCategoriesHelper.getRegularCategoryNames(this.projectConfiguration.getCategoriesMap());
    }


    public getOverviewCategoryNames(): string[] {

        return ProjectCategoriesHelper.getOverviewCategoryNames(this.projectConfiguration.getCategoriesMap());
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

        return ProjectCategoriesHelper.isGeometryCategory(this.projectConfiguration.getCategoriesMap(), categoryName);
    }


    public getOverviewCategories(): string[] {

        return Object.keys(this.projectConfiguration.getCategoryAndSubcategories('Operation'))
            .concat(['Place'])
            .filter(el => el !== 'Operation');
    }


    private getSuperCategoryNames(superCategoryName: string) {

        return Object.keys(
            ProjectCategoriesHelper.getCategoryAndSubcategories(
                superCategoryName, this.projectConfiguration.getCategoriesMap()
            )
        );
    }
}
