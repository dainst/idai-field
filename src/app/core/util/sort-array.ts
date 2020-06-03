import {is, on, separate, Path} from 'tsfun';
import {copy} from 'tsfun/src/collection';
import {Category} from '../configuration/model/category';


export function sortArray(order: string[], path: Path) {

    return <A /* TODO should extend tsfun|struct, to support finding comparable string on path */>(items: Array<A>): Array<A> => {

        let source = copy(items);
        let sortedCategories: Array<Category> = [];

        for (let categoryName of order) {
            const [match, rest] = separate(on(path, is(categoryName)), source);
            sortedCategories = sortedCategories.concat(match);
            source = rest;
        }

        return sortedCategories.concat(source as any) as any;
    }
}
