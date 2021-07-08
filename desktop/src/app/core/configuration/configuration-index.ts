import {Map, clone, keysValues, right} from 'tsfun';
import {addSourceField, BuiltinCategoryDefinition,
    LanguageConfiguration, LibraryCategoryDefinition,
    mergeBuiltInWithLibraryCategories,
    applyLanguagesToCategory,
    Category,
    createContextIndependentCategories
} from 'idai-field-core';


export interface ConfigurationIndex {

    [term: string]: any /* a unique CategoryDefinition per label, for now */
}


/**
 * @author Daniel de Oliveira
 */
export namespace ConfigurationIndex {

    export function create(builtinCategories: Map<BuiltinCategoryDefinition>,
                           libraryCategories: Map<LibraryCategoryDefinition>,
                           languages: { [language: string]: Array<LanguageConfiguration> })
    : [Array<any>, ConfigurationIndex] {

        const categories = createContextIndependentCategories(
            builtinCategories,
            libraryCategories,
            languages);

        return [categories, categories.reduce((index, category) => {

            const defaultLabel = category['defaultLabel'];
            for (const label of Object.values(defaultLabel)) {
                index[label as any] = category;
            }
            return index;
        }, {})];
    }


    export function find(index: ConfigurationIndex,
                         searchTerm: string): Array<Category> {

        return keysValues(index)
            .filter(([categoryName, _]) =>
                categoryName.toLocaleLowerCase().startsWith(searchTerm))
            .map(right);
    }
}
