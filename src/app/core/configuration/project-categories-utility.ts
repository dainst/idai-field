import {Injectable} from '@angular/core';
import {ProjectConfiguration} from './project-configuration';
import {ProjectCategories} from './project-categories';


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


    public getFeatureCategoryNames(): string[] {

        return this.getSuperCategoryNames('Feature');
    }


    public getOperationCategoryNames(): string[] {

        return this.getSuperCategoryNames('Operation');
    }


    public getNamesOfCategoriesAndSubcategories(supercategoryName: string): string[] {

        return this.getSuperCategoryNames(supercategoryName);
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
