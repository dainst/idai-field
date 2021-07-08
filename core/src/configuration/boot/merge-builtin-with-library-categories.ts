import { clone, keysValues, Map } from 'tsfun';
import { ObjectUtils } from '../../tools/object-utils';
import { BuiltinCategoryDefinition } from '../model/builtin-category-definition';
import { LibraryCategoryDefinition } from '../model/library-category-definition';
import { TransientCategoryDefinition } from '../model/transient-category-definition';
import { ConfigurationErrors } from './configuration-errors';
import { mergeFields } from './merge-fields';


export function mergeBuiltInWithLibraryCategories(builtInCategories: Map<BuiltinCategoryDefinition>,
                                                  libraryCategories: Map<LibraryCategoryDefinition>): Map<TransientCategoryDefinition> {

    const categories: Map<TransientCategoryDefinition>
        = clone(builtInCategories) as unknown as Map<TransientCategoryDefinition>;
    for (const [name, category] of keysValues(categories)) {
        category.categoryName = name;
        category.name = name;
    }

    for (const [name, libraryCategory] of keysValues(libraryCategories)) {

        const extendedBuiltInCategory = builtInCategories[libraryCategory.categoryName];
        if (extendedBuiltInCategory) {
            const newMergedCategory: any = ObjectUtils.jsonClone(extendedBuiltInCategory);
            merge(newMergedCategory, libraryCategory);
            newMergedCategory['source'] = 'library';
            newMergedCategory.name = name;

            keysValues(libraryCategory.fields).forEach(([libraryCategoryFieldName, libraryCategoryField]) => {
                if (extendedBuiltInCategory.fields[libraryCategoryFieldName]
                        && (libraryCategoryField as any)['inputType']) {
                    throw [
                        ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, name,
                        libraryCategoryFieldName
                    ];
                }
            });
            mergeFields(newMergedCategory.fields, libraryCategory.fields as any);
            categories[name] = newMergedCategory;
        } else {
            if (!libraryCategory.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, name];
            categories[name] = libraryCategory as TransientCategoryDefinition;
            categories[name].name = name;
            categories[name].categoryName = libraryCategory.categoryName;
        }
    }

    return categories;
}


function merge(target: any, source: any) {

    for (let sourceFieldName of Object.keys(source)) {
        if (sourceFieldName === 'fields') continue;
        let alreadyPresentInTarget = false;
        for (let targetFieldName of Object.keys(target)) {
            if (targetFieldName === sourceFieldName) alreadyPresentInTarget = true;
        }
        if (!alreadyPresentInTarget) target[sourceFieldName] = source[sourceFieldName];
    }

    if (source.libraryId) target.libraryId = source.libraryId;
    if (source.groups) target.groups = source.groups;
}
