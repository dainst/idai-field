import {Map, update, Mapping, compose} from 'tsfun';
import {map} from 'tsfun/associative';
import {Category} from '../model/category';



export function mapCategoriesTree(f: Mapping<Category>) {

    return (categories: Map<Category>) => {

        return map(compose(f, update('children', map(f))), categories);
    }
}
