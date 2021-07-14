import { keysValues, right, set } from 'tsfun';
import { Category, Name } from 'idai-field-core';


export interface ConfigurationIndex {

    [term: string]: any /* a unique CategoryDefinition per label, for now */
}


/**
 * @author Daniel de Oliveira
 */
export namespace ConfigurationIndex {

    export function create(contextIndependentCategories: Array<Category>): ConfigurationIndex {

        return contextIndependentCategories.reduce((index, category) => {

            const defaultLabel = category[Category.DEFAULT_LABEL];
            for (const label of Object.values(defaultLabel)) {
                index[label as any] = category;
            }
            return index;
        }, {});
    }


    export function find(index: ConfigurationIndex,
                         searchTerm: string,
                         parentCategory: Name): Array<Category> {

        return set(keysValues(index)
            .filter(([categoryName, _]) =>
                categoryName.toLocaleLowerCase().startsWith(searchTerm))
            .map(right))
            .filter(category =>
                category[Category.PARENT_CATEGORY].name === parentCategory);
    }
}
