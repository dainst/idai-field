import {filter, flow, includedIn, is, map, remove} from 'tsfun';
import {Category} from './model/category';
import {Named, onName, TreeList, toName, flattenTree, filterTrees, removeTrees, isTopLevelItemOrChildThereof} from '@idai-field/core';
import {Name} from '../constants';


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
export /* package-private */ module ProjectCategories {

    export function isGeometryCategory(t: TreeList<Named>, category: Name): boolean {

        return !isTopLevelItemOrChildThereof(t, category,
            'Image', 'Inscription', 'Type', 'TypeCatalog', 'Project');
    }


    export function getRegularCategoryNames(t: TreeList<Category>): Array<Name> {

        return flow(t,
            removeTrees('Place', 'Project', TYPE_CATALOG, TYPE, 'Image', 'Operation'),
            flattenTree,
            map(toName)
        );
    }


    export function getConcreteFieldCategories(t: TreeList<Category>): Array<Category> {

        return flow(t,
            removeTrees('Image', 'Project', TYPE_CATALOG, TYPE),
            flattenTree
        );
    }


    export function getConcreteFieldCategoryNames(t: TreeList<Category>): Array<Name> {

        return getConcreteFieldCategories(t).map(toName);
    }


    export function getFieldCategories(t: TreeList<Category>): Array<Category> {

        return flow(t,
            removeTrees('Image', 'Project'),
            flattenTree
        );
    }


    export function getFieldCategoryNames(t: TreeList<Category>): Array<Name> {

        return getFieldCategories(t).map(toName);
    }


    export function getOverviewCategoryNames(t: TreeList<Category>): Array<Name> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            flattenTree,
            map(toName)
        );
    }


    export function getOverviewCategories(t: TreeList<Category>): Array<Name> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            flattenTree,
            remove(onName(is('Operation'))), // TODO review why we do remove this here but not in getOverviewCategoryNames, compare also getOverviewToplevelCategories
            map(toName)
        ) as any /* TODO review any*/;
    }


    export function getOverviewToplevelCategories(t: TreeList<Category>): Array<Category> {

        return flow(t,
            filterTrees('Operation', 'Place'),
            flattenTree,
            filter(onName(includedIn(['Operation', 'Place'])))
        ) as any /* TODO review any*/;
    }


    export function getTypeCategories(t: TreeList<Category>): Array<Category> {

        return flow(t,
            filterTrees('Type', 'TypeCatalog'),
            flattenTree
        );
    }


    export function getTypeCategoryNames(): Array<Name> {

        return TYPE_CATALOG_AND_TYPE;
    }


    export function getImageCategoryNames(t: TreeList<Category>): Array<Name> {

        return flow(t,
            filterTrees('Image'),
            flattenTree,
            map(_ => _.name)
        );
    }


    export function getFeatureCategoryNames(categories: TreeList<Category>): string[] {

        return getSuperCategoryNames(categories, 'Feature');
    }


    export function getOperationCategoryNames(categories: TreeList<Category>): string[] {

        return getSuperCategoryNames(categories, 'Operation');
    }


    function getSuperCategoryNames(categories: TreeList<Category>, superCategoryName: string) {

        return flow(
            categories,
            filterTrees(superCategoryName),
            flattenTree,
            map(toName));
    }
}
