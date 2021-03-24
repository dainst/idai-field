import {is, on, copy, separate, Path} from 'tsfun';
// import {Category} from '../../../desktop/src/app/core/configuration/model/category';


export function sortStructArray(order: string[], path: Path) {

    return <S /* a struct on which we can use path */>(items: Array<S>): Array<S> => {

        let source = copy(items);
        let sortedCategories: Array<any /* TODO review any and category variable names*/> = [];

        for (let categoryName of order) {
            const [match, rest] = separate(on(path, is(categoryName)), source);
            sortedCategories = sortedCategories.concat(match as any /* TODO review typing */);
            source = rest;
        }

        return sortedCategories.concat(source as any) as any;
    }
}
