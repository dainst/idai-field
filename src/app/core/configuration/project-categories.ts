import {filter, flow, includedIn, is, map, Map, remove, to} from 'tsfun';
import {Category} from './model/category';
import {Named, onName, toName} from '../util/named';
import {flattenTreelist, Treelist} from '../util/treelist';
import {Name} from '../constants';
import {filterTrees, isTopLevelItemOrChildThereof, removeTrees} from '../util/named-treelist';

const TYPE_CATALOG = 'TypeCatalog';
const TYPE = 'Type';
const TYPE_CATALOG_AND_TYPE = [TYPE_CATALOG, TYPE];
// TODO add more consts, move constants to central place, shared with app-configurator


/**
 * Outside of the configuration package, this module should not be accessed directly,
 * but instead via ProjectCategories (project-categories.ts) or ProjectConfiguration (project-configuration.ts).
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export /* package-private */ module ProjectCategories {

    export function isGeometryCategory(t: Treelist<Named>, category: Name): boolean {

        return !isTopLevelItemOrChildThereof(t, category,
            'Image', 'Inscription', 'Type', 'TypeCatalog', 'Project');
    }


    export function getRegularCategoryNames(t: Treelist<Category>): Array<Name> {

        return flow(t,
            removeTrees('Place', 'Project', TYPE_CATALOG, TYPE, 'Image', 'Operation'),
            flattenTreelist,
            map(toName)
        );
    }


    export function getConcreteFieldCategories(t: Treelist<Category>): Array<Category> {

        return flow(t,
            removeTrees('Image', 'Project', TYPE_CATALOG, TYPE),
            flattenTreelist
        );
    }


    export function getFieldCategories(t: Treelist<Category>): Array<Category> {

        return flow(t,
            removeTrees('Image', 'Project'),
            flattenTreelist
        );
    }


    export function getOverviewCategoryNames(t: Treelist<Category>): Array<Name> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            flattenTreelist,
            map(toName)
        );
    }


    export function getOverviewCategories(t: Treelist<Category>): Array<Name> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            flattenTreelist,
            remove(onName(is('Operation'))), // TODO review why we do remove this here but not in getOverviewCategoryNames, compare also getOverviewToplevelCategories
            map(toName)
        );
    }


    export function getOverviewToplevelCategories(t: Treelist<Category>): Array<Category> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            flattenTreelist,
            filter(onName(includedIn(['Operation', 'Place'])))
        );
    }


    export function getTypeCategories(t: Treelist<Category>): Array<Category> {

        return flow(t,
            filterTrees('Type', 'TypeCatalog'),
            flattenTreelist
        );
    }


    export function getTypeCategoryNames(): Array<Name> {

        return TYPE_CATALOG_AND_TYPE;
    }


    /**
     * @deprecated
     */
    export function getCategoryAndSubcategories(supercategory: Name, categoriesMap: Map<Category>): Map<Category> {

        if (!categoriesMap[supercategory]) return {};

        const subcategories: Map<Category> = {};
        subcategories[supercategory] = categoriesMap[supercategory];

        if (categoriesMap[supercategory].children) {
            for (let i = categoriesMap[supercategory].children.length - 1; i >= 0; i--) {
                subcategories[categoriesMap[supercategory].children[i].name]
                    = categoriesMap[supercategory].children[i];
            }
        }
        return subcategories;
    }


    export function getImageCategoryNames(t: Treelist<Category>): Array<Name> {

        return flow(t,
            filterTrees('Image'),
            flattenTreelist,
            map(to([Named.NAME]))
        );
    }
}
