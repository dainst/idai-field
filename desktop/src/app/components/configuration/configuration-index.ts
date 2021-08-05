import { flatten, keysValues, right, set } from 'tsfun';
import { Category, Name } from 'idai-field-core';


export interface ConfigurationIndex {

    [term: string]: Array<Category>;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export namespace ConfigurationIndex {

    export function create(contextIndependentCategories: Array<Category>): ConfigurationIndex {

        return contextIndependentCategories.reduce((index, category) => {

            const terms: string[] = Object.values(category.defaultLabel).concat([category.name]);
            if (category.libraryId) terms.push(category.libraryId);

            for (const term of terms) {
                if (!index[term]) index[term] = [];
                if (!index[term].includes(category)) index[term].push(category);
            }

            return index;
        }, {});
    }


    export function find(index: ConfigurationIndex,
                         searchTerm: string,
                         parentCategory?: Name,
                         onlySupercategories?: boolean): Array<Category> {

        return set(flatten(keysValues(index)
            .filter(([categoryName, _]) => categoryName.toLocaleLowerCase().startsWith(searchTerm.toLowerCase()))
            .map(right)
        )).filter(category => {
            return (!onlySupercategories || !category.parentCategory)
                && (!parentCategory || category.parentCategory?.name === parentCategory);
        });
    }
}
