import {Map} from 'tsfun';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {FieldDefinition} from 'idai-field-core';
import {TransientFieldDefinition, TransientCategoryDefinition} from '../model/transient-category-definition';


export function addSourceField(builtInCategories: Map<BuiltinCategoryDefinition>,
                               libraryCategories: Map<LibraryCategoryDefinition>,
                               customCategories: Map<CustomCategoryDefinition>,
                               commonFields: Map<any>) {

    setFieldSourceOnCategories(builtInCategories, FieldDefinition.Source.BUILTIN);
    setFieldSourceOnCategories(libraryCategories, FieldDefinition.Source.LIBRARY);
    setFieldSourceOnCategories(customCategories, FieldDefinition.Source.CUSTOM);
    setFieldSourceOnFields(commonFields, FieldDefinition.Source.COMMON);
}


function setFieldSourceOnCategories(categories: any, value: any) {

    Object.values(categories).forEach((category: TransientCategoryDefinition) =>
        setFieldSourceOnFields(category.fields, value));
}


function setFieldSourceOnFields(fields: any, value: any) {

    Object.values(fields).forEach((field: TransientFieldDefinition) => field.source = value);
}
