import { forEach, map, Map, to } from 'tsfun';
import { Field } from '../../model/configuration/field';
import { BaseCategoryDefinition } from '../model/category/base-category-definition';
import { BuiltInCategoryDefinition } from '../model/category/built-in-category-definition';
import { LibraryCategoryDefinition } from '../model/category/library-category-definition';
import { BaseFieldDefinition } from '../model/field/base-field-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { BaseFormDefinition } from '../model/form/base-form-definition';
import { CustomFormDefinition } from '../model/form/custom-form-definition';
import { LibraryFormDefinition } from '../model/form/library-form-definition';


export function addSourceField(builtInCategories: Map<BuiltInCategoryDefinition>,
                               libraryCategories: Map<LibraryCategoryDefinition>,
                               libraryForms: Map<LibraryFormDefinition>,
                               commonFields: Map<BuiltInFieldDefinition>,
                               customForms?: Map<CustomFormDefinition>) {

    setFieldSourceOnForms(map(to(BaseCategoryDefinition.MINIMAL_FORM), builtInCategories), Field.Source.BUILTIN);
    setFieldSourceOnForms(map(to(BaseCategoryDefinition.MINIMAL_FORM), libraryCategories), Field.Source.LIBRARY);
    setFieldSourceOnForms(libraryForms, Field.Source.LIBRARY);

    forEach(builtInCategories, category => setFieldSourceOnFields(category.fields, Field.Source.BUILTIN));
    forEach(libraryCategories, category => setFieldSourceOnFields(category.fields, Field.Source.LIBRARY));
    if (commonFields) setFieldSourceOnFields(commonFields, Field.Source.COMMON);

    if (customForms) {
        setFieldSourceOnForms(customForms, Field.Source.CUSTOM);
        forEach(customForms, form => setFieldSourceOnFields(form.fields, Field.Source.CUSTOM));
    }
}


function setFieldSourceOnForms(forms: Map<BaseFormDefinition|undefined>, value: Field.SourceType) {

    for (const form of Object.values(forms)) {
        if (!form) continue;
        form.source = value;
    }
}


function setFieldSourceOnFields(fields: Map<BaseFieldDefinition>, value: Field.SourceType) {

    for (const field of Object.values(fields)) {
        
        field.source = value;
    }
}
