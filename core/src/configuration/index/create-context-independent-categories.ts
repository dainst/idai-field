import { Map } from 'tsfun';
import { Category, Relation, Valuelist } from '../../model';
import { Tree } from '../../tools/forest';
import { buildRawProjectConfiguration } from '../boot';
import { BuiltinCategoryDefinition, BuiltinFieldDefinition } from '../model/builtin-category-definition';
import { LanguageConfiguration } from '../model/language-configuration';
import { LibraryCategoryDefinition } from '../model/library-category-definition';
import { RawProjectConfiguration } from '../../services/project-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function createContextIndependentCategories(builtInCategories: Map<BuiltinCategoryDefinition>,
                                                   builtInRelations: Array<Relation>,
                                                   libraryCategories: Map<LibraryCategoryDefinition>,
                                                   commonFields: Map<BuiltinFieldDefinition>,
                                                   extraFields: Map<BuiltinFieldDefinition>,
                                                   valuelists: Map<Valuelist>,
                                                   selectedParentCategories: string[],
                                                   languages: { [language: string]: Array<LanguageConfiguration> })
                                                   : Array<Category> {

    const [categories,]: RawProjectConfiguration = buildRawProjectConfiguration(
        builtInCategories,
        libraryCategories,
        undefined,
        commonFields,
        valuelists,
        extraFields,
        builtInRelations,
        { default: languages, complete: languages },
        undefined,
        undefined,
        selectedParentCategories
    );

   return Tree.flatten(categories);
}  
