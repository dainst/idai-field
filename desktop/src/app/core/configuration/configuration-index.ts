import { Map, keysValues, right, set } from 'tsfun';
import { BuiltinCategoryDefinition, LanguageConfiguration, LibraryCategoryDefinition, Category,
    createContextIndependentCategories, RelationDefinition, Name } from 'idai-field-core';


export interface ConfigurationIndex {

    [term: string]: any /* a unique CategoryDefinition per label, for now */
}


/**
 * @author Daniel de Oliveira
 */
export namespace ConfigurationIndex {

    export function create(builtinCategories: Map<BuiltinCategoryDefinition>,
                           builtInRelations: Array<RelationDefinition>,
                           libraryCategories: Map<LibraryCategoryDefinition>,
                           languages: { [language: string]: Array<LanguageConfiguration> })
            : ConfigurationIndex {

        const categories = createContextIndependentCategories(
            builtinCategories,
            builtInRelations,
            libraryCategories,
            languages);

        return categories.reduce((index, category) => {

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
