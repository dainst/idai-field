import {update, Mapping, compose, map, Map, flatten, to} from 'tsfun';
import {Category} from '../model/category';
import {namedArrayToNamedMap} from '../../util/named';



export function mapCategoriesTree(f: Mapping<Category>) {

    return (categoriesTree: Array<Category>) => {

        return categoriesTree.map(compose(f, update('children', map(f))));
    }
}
