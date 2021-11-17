import { Map } from 'tsfun';
import { RawProjectConfiguration } from '../../services/project-configuration';
import { Relation } from '../../model/configuration/relation';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { LibraryFormDefinition } from '../model/form/library-form-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { Valuelist } from '../../model/configuration/valuelist';
import { buildRawProjectConfiguration } from '../boot/build-raw-project-configuration';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { LanguageConfiguration } from '../model/language/language-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function createRawLibraryConfiguration(builtInCategories: Map<BuiltInCategoryDefinition>,
                                              libraryCategories: Map<LibraryCategoryDefinition>,
                                              builtInRelations: Array<Relation>,
                                              libraryForms: Map<LibraryFormDefinition>,
                                              commonFields: Map<BuiltInFieldDefinition>,
                                              builtInFields: Map<BuiltInFieldDefinition>,
                                              valuelists: Map<Valuelist>,
                                              selectedParentForms: string[],
                                              languages: { [language: string]: Array<LanguageConfiguration> })
                                              : RawProjectConfiguration{

    return buildRawProjectConfiguration(
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
}  
