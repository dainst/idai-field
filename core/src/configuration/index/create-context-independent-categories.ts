import { Map, clone, remove, isUndefined, on, is, filter, not, keysValues, curry, flow } from 'tsfun';
import { Category, Field, RelationDefinition } from '../../model';
import { Named } from '../../tools';
import { Tree } from '../../tools/forest';
import { applyLanguagesToCategory, makeCategoryForest } from '../boot';
import { addSourceField } from '../boot/add-source-field';
import { setGroupLabels } from '../boot/set-group-labels';
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
                                                   builtInRelations: Array<RelationDefinition>,
                                                   libraryCategories: Map<LibraryCategoryDefinition>,
                                                   languages: { [language: string]: Array<LanguageConfiguration> })
                                                   : Array<Category> {

    const bCats = clone(builtinCategories);
    const lCats = remove(on(LibraryCategoryDefinition.PARENT, 
                            isUndefined),
                         clone(libraryCategories));

    addSourceField(bCats, lCats, undefined, undefined);
    const result = mergeBuiltInWithLibraryCategories(bCats, lCats);

    const languageConfigurations = {
        default: languages,
        complete: languages
    };

    for (const [name, category] of keysValues(result)) {

        category.fields = filter(category.fields, 
            on(Field.SOURCE, is(Field.Source.LIBRARY)));

        applyLanguagesToCategory(languageConfigurations, category, category.categoryName);
        category[Named.NAME] = name;
    }

    return flow(
        makeCategoryForest(builtInRelations)(result),
        Tree.mapForest(curry(setGroupLabels, languageConfigurations)),
        Tree.flatten,
        filter(on(Category.PARENT_CATEGORY, not(isUndefined))));
}
