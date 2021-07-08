import { Map, clone, keysValues, detach } from 'tsfun';
import { Tree } from '../../tools';
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

    for (const [name, category] of keysValues(result)) {
        category['name'] = name;
    }

    // console.log("cats", JSON.stringify(result, null, 4))

    const res = makeCategoryForest(result);

    for (const res2 of Tree.flatten(res)) {

        // console.log(res2.name)
        // console.log(JSON.stringify(res2.defaultLabel))
    }

    return "abcdef";
}