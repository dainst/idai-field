import {Map, clone} from 'tsfun';
import {addSourceField, BuiltinCategoryDefinition,
    LanguageConfiguration, LibraryCategoryDefinition,
    mergeBuiltInWithLibraryCategories,
    applyLanguagesToCategories
} from 'idai-field-core';


export interface ConfigurationIndex {

}


export namespace ConfigurationIndex {

    export function create(builtinCategories: Map<BuiltinCategoryDefinition>,
                           libraryCategories: Map<LibraryCategoryDefinition>,
                           languages: { [language: string]: Array<LanguageConfiguration> })
    : ConfigurationIndex {

        const bCats = clone(builtinCategories);
        const lCats = clone(libraryCategories);
        addSourceField(bCats, lCats, undefined, undefined);
        const result = mergeBuiltInWithLibraryCategories(bCats, lCats);

        applyLanguagesToCategories(
            {
                default: languages,
                complete: {}
            }, result);

        console.log("result", result)

        return undefined;
    }


    export function find(index: ConfigurationIndex, searchTerm: string) {

        return 'abcdef';
    }
}
