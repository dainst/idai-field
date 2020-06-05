import {isnt, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Named} from '../util/named';
import NAME = Named.NAME;
import {Treelist} from './treelist';
import {Name} from '../constants';
import {isTopLevelItemOrChildThereof} from './named-treelist';

const TYPE_CATALOG = 'TypeCatalog';
const TYPE = 'Type';
const TYPE_CATALOG_AND_TYPE = [TYPE_CATALOG, TYPE];


/**
 * Outside of the configuration package, this module should not be accessed directly,
 * but instead via ProjectCategories (project-categories.ts) or ProjectConfiguration (project-configuration.ts).
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export /* package-private */ module ProjectCategoriesHelper {

    export const UNKNOWN_CATEGORY_ERROR = 'ProjectCategories.Errors.UnknownCategory';


    export function isGeometryCategory(t: Treelist<Named>, category: Name): boolean {

        return !isTopLevelItemOrChildThereof(t, category,
            'Image', 'Inscription', 'Type', 'TypeCatalog', 'Project');
    }


    export function getRegularCategoryNames(categoriesMap: Map<Category>): string[] {

        return Object.values(categoriesMap)
            .map(to(NAME))
            .filter(isnt('Place'))
            .filter(isnt('Project'))
            .filter(categoryName => !isSubcategory(categoriesMap, categoryName, 'Operation'))
            .filter(categoryName => !isSubcategory(categoriesMap, categoryName, 'Image'))
            .filter(categoryName => !isSubcategory(categoriesMap, categoryName, 'TypeCatalog'))
            .filter(categoryName => !isSubcategory(categoriesMap, categoryName, 'Type'));
    }


    export function getConcreteFieldCategories(categoriesMap: Map<Category>): Array<Category> {

        return Object.values(categoriesMap)
            .filter(category => !isSubcategory(categoriesMap, category.name, 'Image'))
            .filter(category => !isSubcategory(categoriesMap, category.name, TYPE_CATALOG))
            .filter(category => !isSubcategory(categoriesMap, category.name, TYPE))
            .filter(category => !ProjectCategoriesHelper.isProjectCategory(category.name));
    }


    export function getFieldCategories(categoriesMap: Map<Category>): Array<Category> {

        return Object.values(categoriesMap)
            .filter(category => !isSubcategory(categoriesMap, category.name, 'Image'))
            .filter(category => !ProjectCategoriesHelper.isProjectCategory(category.name));
    }


    export function getOverviewCategoryNames(categoriesMap: Map<Category>): string[] {

        return Object.values(categoriesMap)
            .map(to(NAME))
            .filter(categoryName => isSubcategory(categoriesMap, categoryName, 'Operation'))
            .concat('Place');
    }


    export function getOverviewCategories(categoriesMap: Map<Category>): string[] {

        return Object.keys(getCategoryAndSubcategories('Operation', categoriesMap))
            .concat(['Place'])
            .filter(el => el !== 'Operation');
    }


    export function getOverviewTopLevelCategories(categoriesArray: Array<Category>): Array<Category> {

        return categoriesArray.filter(category => category.name === 'Operation' || category.name === 'Place');
    }


    export function getTypeCategories(categoriesArray: Array<Category>): Array<Category> {

        return categoriesArray.filter(category => category.name === TYPE_CATALOG || category.name === TYPE);
    }


    export function getTypeCategoryNames(): string[] {

        return TYPE_CATALOG_AND_TYPE;
    }


    export function isSubcategory(categoriesMap: Map<Category>,
                                  categoryName: string,
                                  superCategoryName: string): boolean {

        const category: Category = categoriesMap[categoryName];
        if (!category) throw [UNKNOWN_CATEGORY_ERROR, categoryName];

        return category.name === superCategoryName
            || (category.parentCategory?.name !== undefined
                && category.parentCategory.name === superCategoryName);
    }


    export function getCategoryAndSubcategories(supercategoryName: string, categoriesMap: Map<Category>): Map<Category> {

        return getCategoryAndSubcategories_(supercategoryName, categoriesMap);
    }


    export function getImageCategoryNames(projectCategoriesMap: Map<Category>): string[] {

        return Object.keys(getCategoryAndSubcategories('Image', projectCategoriesMap));
    }


    export function isProjectCategory(categoryName: string): boolean {

        return categoryName === 'Project';
    }


    export function getCategoryAndSubcategories_(supercategoryName: string, projectCategoriesMap: Map<Category>)
        : Map<Category> {

            if (!projectCategoriesMap[supercategoryName]) return {};

        const subcategories: Map<Category> = {};
        subcategories[supercategoryName] = projectCategoriesMap[supercategoryName];

        if (projectCategoriesMap[supercategoryName].children) {
            for (let i = projectCategoriesMap[supercategoryName].children.length - 1; i >= 0; i--) {
                subcategories[projectCategoriesMap[supercategoryName].children[i].name]
                    = projectCategoriesMap[supercategoryName].children[i];
            }
        }
        return subcategories;
    }
}
