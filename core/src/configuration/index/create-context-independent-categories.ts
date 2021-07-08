import { Map, clone, values, keysValues, remove, isUndefined, on, is, filter } from 'tsfun';
import { applyLanguagesToCategory, makeCategoryForest} from '../boot';
import { addSourceField } from '../boot/add-source-field';
import { mergeBuiltInWithLibraryCategories } from '../boot/merge-builtin-with-library-categories';
import { BuiltinCategoryDefinition } from '../model/builtin-category-definition';
import {LanguageConfiguration} from '../model/language-configuration';
import { LibraryCategoryDefinition } from '../model/library-category-definition';


/**
 * @author Daniel de Oliveira
 */
export function createContextIndependentCategories(builtinCategories: Map<BuiltinCategoryDefinition>,
                                                   libraryCategories: Map<LibraryCategoryDefinition>,
                                                   languages: { [language: string]: Array<LanguageConfiguration> }) {

    const bCats = clone(builtinCategories);
    const lCats = remove(clone(libraryCategories), 
                         on(LibraryCategoryDefinition.Properties.PARENT, isUndefined));
    addSourceField(bCats, lCats, undefined, undefined);
    const result = mergeBuiltInWithLibraryCategories(bCats, lCats);

    for (const category of values(result)) {

        category.fields = filter(category.fields, on('source', is('library')));
    }

    for (const category of Object.values(result)) {
        applyLanguagesToCategory(
            {
                default: languages,
                complete: {}
            }, category, category.categoryName);
    }

    for (const [name, category] of keysValues(result)) {
        category['name'] = name;
    }

    return makeCategoryForest(result);
}