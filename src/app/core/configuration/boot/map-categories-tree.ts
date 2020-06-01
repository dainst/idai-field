import {update, Mapping, compose, map} from 'tsfun';
import {Category} from '../model/category';



export function mapCategoriesTree(f: Mapping<Category>) {

    return (categoriesTree: Array<Category>) => {

        return categoriesTree.map(compose(f, update('children', map(f))));
    }
}
