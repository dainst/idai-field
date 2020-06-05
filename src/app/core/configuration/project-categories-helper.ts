import {flow, map, Map, to} from 'tsfun';
import {Category} from './model/category';
import {Named} from '../util/named';
import NAME = Named.NAME;
import {flattenTreelist, Treelist} from './treelist';
import {Name} from '../constants';
import {filterTrees, isTopLevelItemOrChildThereof, removeTrees} from './named-treelist';
import {logWithMessage} from '../util/utils';

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


    export function getRegularCategoryNames(t: Treelist<Category>): Array<Name> {

        return flattenTreelist(removeTrees(t,
            'Place', 'Project', TYPE_CATALOG, TYPE, 'Image', 'Operation')).map(to([Named.NAME]));
    }


    export function getConcreteFieldCategories(t: Treelist<Category>): Array<Category> {

        return flattenTreelist(removeTrees(t, 'Image', 'Project', TYPE_CATALOG, TYPE));
    }


    export function getFieldCategories(t: Treelist<Category>): Array<Category> {

        return flattenTreelist(removeTrees(t, 'Image', 'Project'));
    }


    export function getOverviewCategoryNames(t: Treelist<Category>): string[] {

        return flow(t,
            filterTrees('Operation', 'Place'),
            flattenTreelist,
            map(to([Named.NAME])));
    }


    export function getOverviewCategories(categoriesMap: Map<Category>): string[] {

        return Object.keys(getCategoryAndSubcategories('Operation', categoriesMap))
            .concat(['Place'])
            .filter(el => el !== 'Operation');
    }


    export function getOverviewToplevelCategories(categoriesArray: Array<Category>): Array<Category> {

        return categoriesArray.filter(category => category.name === 'Operation' || category.name === 'Place');
    }


    export function getTypeCategories(t: Treelist<Category>): Array<Category> {

        return flow(t,
            filterTrees('Type', 'TypeCatalog'),
            flattenTreelist);
    }


    export function getTypeCategoryNames(): string[] {

        return TYPE_CATALOG_AND_TYPE;
    }


    /**
     * @deprecated
     */
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


    export function getImageCategoryNames(t: Treelist<Category>): Array<Name> {

        return flow(t,
            filterTrees('Image'),
            flattenTreelist,
            map(to([Named.NAME])));
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
