import {Injectable} from '@angular/core';
import {ProjectConfiguration} from './project-configuration';
import {Category} from './model/category';
import {ProjectCategories} from './project-categories';
import {toName} from '../util/named';



@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 *
 * TODO try get rid completely of this class, since clients can now ask ProjectConfiguration for the categoryTreelist and pass it to ProjectCategories' functions
 */
export class ProjectCategoriesUtility {

    public static UNKNOWN_TYPE_ERROR = 'projectCategories.Errors.UnknownType';


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public getConcreteFieldCategories(): Array<Category> {

        return ProjectCategories.getConcreteFieldCategories(this.projectConfiguration.getCategoryTreelist());
    }


    public getTypeCategories(): Array<Category> {

        return ProjectCategories.getTypeCategories(this.projectConfiguration.getCategoryTreelist());
    }


    public getTypeCategoryNames(): string[] {

        return ProjectCategories.getTypeCategoryNames();
    }


    public getConcreteFieldCategoryNames(): string[] {

        return this.getConcreteFieldCategories().map(toName);
    }


    public getImageCategoryNames(): string[] {

        return ProjectCategories.getImageCategoryNames(this.projectConfiguration.getCategoryTreelist());
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

        return ProjectCategories.getRegularCategoryNames(
            this.projectConfiguration.getCategoryTreelist());
    }


    public getOverviewCategoryNames(): string[] {

        return ProjectCategories.getOverviewCategoryNames(
            this.projectConfiguration.getCategoryTreelist());
    }


    public isGeometryCategory(categoryName: string): boolean {

        return ProjectCategories.isGeometryCategory(
            this.projectConfiguration.getCategoryTreelist(),
            categoryName
        );
    }


    public getOverviewCategories(): string[] {

        return ProjectCategories.getOverviewCategories(this.projectConfiguration.getCategoryTreelist());
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


    // TODO implement via flattenTreelist and filterToplevelCategories (or something similar)
    private getSuperCategoryNames(superCategoryName: string) {

        return Object.keys(
            ProjectCategories.getCategoryAndSubcategories(
                superCategoryName, this.projectConfiguration.getCategoriesMap()
            )
        );
    }
}
