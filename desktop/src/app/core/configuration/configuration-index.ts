import {Map, clone, keysValues} from 'tsfun';
import {addSourceField, BuiltinCategoryDefinition,
    LanguageConfiguration, LibraryCategoryDefinition,
    mergeBuiltInWithLibraryCategories,
    applyLanguagesToCategory
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
    : ConfigurationIndex {

        const bCats = clone(builtinCategories);
        const lCats = clone(libraryCategories);
        addSourceField(bCats, lCats, undefined, undefined);
        const result = mergeBuiltInWithLibraryCategories(bCats, lCats);

        for (const category of Object.values(result)) {
            applyLanguagesToCategory(
                {
                    default: languages,
                    complete: {}
                }, category, category.categoryName);
        }

        return Object.values(result).reduce((index, category) => {

            const defaultLabel = category['defaultLabel'];
            for (const label of Object.values(defaultLabel)) {
                index[label as any] = category;
            }
            return index;
        }, {});
    }


    export function find(index: ConfigurationIndex, searchTerm: string): any|undefined {

        for (const [categoryName, category] of keysValues(index)) {
            if (categoryName.startsWith(searchTerm)) return category;
        }
    }
}
