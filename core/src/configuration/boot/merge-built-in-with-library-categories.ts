import { Map, map, clone } from 'tsfun';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { LibraryFieldDefinition } from '../model/field/library-field-definition';
import { TransientFieldDefinition } from '../model/field/transient-field-definition'


/**
 * @author Thomas Kleinke
 */
export function mergeBuiltInWithLibraryCategories(builtInCategories: Map<BuiltInCategoryDefinition>,
                                                  libraryCategories: Map<LibraryCategoryDefinition>)
                                                  : Map<TransientCategoryDefinition> {
    
    const result: Map<TransientCategoryDefinition> = map(makeTransientCategoryDefinition, clone(builtInCategories));

    return Object.keys(libraryCategories).reduce((categories, categoryName) => {
        categories[categoryName] = categories[categoryName]
            ? mergeCategories(categories[categoryName], libraryCategories[categoryName])
            : libraryCategories[categoryName] as TransientCategoryDefinition;
        categories[categoryName].name = categoryName;
        return categories;
    }, result) as Map<TransientCategoryDefinition>;
}


function mergeCategories(builtInCategory: BuiltInCategoryDefinition,
                         libraryCategory: LibraryCategoryDefinition): TransientCategoryDefinition {
    
    const result: TransientCategoryDefinition = clone(builtInCategory) as TransientCategoryDefinition;
    
    result.description = libraryCategory.description;
    result.color = libraryCategory.color;
    result.defaultRange = libraryCategory.defaultRange;
    if (libraryCategory.minimalForm) result.minimalForm = libraryCategory.minimalForm as TransientFormDefinition;
    if (libraryCategory.fields) {
        result.fields = mergeFields(builtInCategory.fields, libraryCategory.fields);
    }

    return result;
}


function mergeFields(builtInFields: Map<BuiltInFieldDefinition>,
                     libraryFields: Map<LibraryFieldDefinition>): Map<TransientFieldDefinition> {
    
    return Object.keys(libraryFields).reduce((fields, fieldName) => {
        if (!fields[fieldName]) fields[fieldName] = libraryFields[fieldName];
        return fields;
    }, clone(builtInFields)) as Map<TransientFieldDefinition>;
}


function makeTransientCategoryDefinition(category: BuiltInCategoryDefinition,
                                         categoryName: string): TransientCategoryDefinition {
    
    const result: TransientCategoryDefinition = category as TransientCategoryDefinition;
    result.name = categoryName;
    result.description = {};

    return result;
}
