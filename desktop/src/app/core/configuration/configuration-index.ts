import {Map, clone} from 'tsfun';
import {addSourceField, BuiltinCategoryDefinition, LibraryCategoryDefinition, mergeBuiltInWithLibraryCategories} from 'idai-field-core';


export interface ConfigurationIndex {

}


export namespace ConfigurationIndex {

    export function create(builtinCategories: Map<BuiltinCategoryDefinition>,
                           libraryCategories: Map<LibraryCategoryDefinition>): ConfigurationIndex {

        const bCats = clone(builtinCategories);
        const lCats = clone(libraryCategories);
        addSourceField(bCats, lCats, undefined, undefined);
        const result = mergeBuiltInWithLibraryCategories(bCats, lCats);
        return undefined;
    }


    export function find(index: ConfigurationIndex, searchTerm: string) {

        return 'abcdef';
    }
}
