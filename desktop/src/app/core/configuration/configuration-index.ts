import { flatten, keysValues, right, set } from 'tsfun';
import { Category, Name } from 'idai-field-core';


export interface ConfigurationIndex {

    [term: string]: Array<Category>;
}


/**
 * @author Daniel de Oliveira
 */
export namespace ConfigurationIndex {

    export function create(contextIndependentCategories: Array<Category>): ConfigurationIndex {

        return contextIndependentCategories.reduce((index, category) => {

            const defaultLabel = category[Category.DEFAULT_LABEL];
            for (const label of Object.values(defaultLabel)) {
                if (!index[label]) index[label] = [];
                if (!index[label].includes(category)) index[label].push(category);
            }
            return index;
        }, {});
    }


    export function find(index: ConfigurationIndex,
                         searchTerm: string,
                         parentCategory?: Name): Array<Category> {

        return set(flatten(keysValues(index)
            .filter(([categoryName, _]) => categoryName.toLocaleLowerCase().startsWith(searchTerm.toLowerCase()))
            .map(right)
        )).filter(category => {
            return (!parentCategory && !category.parentCategory)
                || (category.parentCategory && category.parentCategory.name === parentCategory);
        });
    }
}
