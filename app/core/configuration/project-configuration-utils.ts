import {Map} from 'tsfun';
import {Category} from './model/category';
import {RelationDefinition} from './model/relation-definition';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module ProjectConfigurationUtils { // TODO inline into project-configuration

    // TODO reimplement; test
    export function getCategoryAndSubcategories(projectCategoriesMap: Map<Category>,
                                                supercategoryName: string): Map<Category> {

        const subcategories: any = {};

        if (projectCategoriesMap[supercategoryName]) {
            subcategories[supercategoryName] = projectCategoriesMap[supercategoryName];

            if (projectCategoriesMap[supercategoryName].children) {
                for (let i = projectCategoriesMap[supercategoryName].children.length - 1; i >= 0; i--) {
                    subcategories[projectCategoriesMap[supercategoryName].children[i].name]
                        = projectCategoriesMap[supercategoryName].children[i];
                }
            }
        }

        return subcategories;
    }
}