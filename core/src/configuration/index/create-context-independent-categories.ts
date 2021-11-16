import { Map } from 'tsfun';
import { Tree } from '../../tools/forest';
import { RawProjectConfiguration } from '../../services/project-configuration';
import { Relation } from '../../model/configuration/relation';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { LibraryFormDefinition } from '../model/form/library-form-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { Valuelist } from '../../model/configuration/valuelist';
import { CategoryForm } from '../../model/configuration/category-form';
import { buildRawProjectConfiguration } from '../boot/build-raw-project-configuration';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { LanguageConfiguration } from '../model/language/language-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function createContextIndependentCategories(builtInCategories: Map<BuiltInCategoryDefinition>,
                                                   libraryCategories: Map<LibraryCategoryDefinition>,
                                                   builtInRelations: Array<Relation>,
                                                   libraryForms: Map<LibraryFormDefinition>,
                                                   commonFields: Map<BuiltInFieldDefinition>,
                                                   builtInFields: Map<BuiltInFieldDefinition>,
                                                   valuelists: Map<Valuelist>,
                                                   selectedParentForms: string[],
                                                   languages: { [language: string]: Array<LanguageConfiguration> })
                                                   : Array<CategoryForm> {

    const rawConfiguration: RawProjectConfiguration = buildRawProjectConfiguration(
        builtInCategories,
        libraryCategories,
        libraryForms,
        undefined,
        commonFields,
        valuelists,
        builtInFields,
        builtInRelations,
        { default: languages, complete: languages },
        undefined,
        undefined,
        selectedParentForms
    );

   return Tree.flatten(rawConfiguration.forms);
}  
