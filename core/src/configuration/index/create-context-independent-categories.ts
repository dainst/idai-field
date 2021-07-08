import { Map, clone, values, keysValues, remove, isUndefined, on, is, filter, not } from 'tsfun';
import {Category, FieldDefinition} from '../../model';
import { Tree } from '../../tools/forest';
import { applyLanguagesToCategory, makeCategoryForest} from '../boot';
import { addSourceField } from '../boot/add-source-field';
import { mergeBuiltInWithLibraryCategories } from '../boot/merge-builtin-with-library-categories';
import { BuiltinCategoryDefinition } from '../model/builtin-category-definition';
import { LanguageConfiguration } from '../model/language-configuration';
import { LibraryCategoryDefinition } from '../model/library-category-definition';


/**
 * TODO pass in the concretely selected parent categories
 * 
 * @author Daniel de Oliveira
 */
export function createContextIndependentCategories(builtinCategories: Map<BuiltinCategoryDefinition>,
                                                   libraryCategories: Map<LibraryCategoryDefinition>,
                                                   languages: { [language: string]: Array<LanguageConfiguration> })
                                                   : Array<Category> {

    const bCats = clone(builtinCategories);
    const lCats = remove(on(LibraryCategoryDefinition.PARENT, 
                            isUndefined),
                         clone(libraryCategories));

    addSourceField(bCats, lCats, undefined, undefined);
    const result = mergeBuiltInWithLibraryCategories(bCats, lCats);

    for (const category of values(result)) {

        category.fields = filter(on(FieldDefinition.SOURCE, 
                                    is(FieldDefinition.Source.LIBRARY)),
                                 category.fields);
    }

    for (const category of Object.values(result)) {
        applyLanguagesToCategory(
            {
                default: languages,
                complete: languages
            }, category, category.categoryName);
    }

    return filter(
        on('parentCategory', not(isUndefined)),
        Tree.flatten(makeCategoryForest(result)));
}