import { clone, flatten, Map, set, to } from 'tsfun';
import { Relation } from '../../model/configuration/relation';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { BuiltInFieldDefinition } from '../model/field/built-in-field-definition';
import { TransientFieldDefinition } from '../model/field/transient-field-definition';
import { BuiltInFormDefinition } from '../model/form/built-in-form-definition';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { ConfigurationErrors } from './configuration-errors';


/**
 * 
 * @author Thomas Kleinke 
 */
export function addFieldsToForm(form: TransientFormDefinition, categories: Map<TransientCategoryDefinition>,
                                builtInFields: Map<BuiltInFieldDefinition>,
                                commonFields: Map<BuiltInFieldDefinition>,
                                relations: Array<Relation>,
                                extendedForm?: TransientFormDefinition): TransientFormDefinition {

    const fieldNames: string[] = getFieldNames(form, categories, extendedForm);

    const clonedForm = clone(form);
    if (extendedForm) Object.assign(clonedForm.fields, extendedForm.fields);

    clonedForm.fields = fieldNames.reduce((fields, fieldName) => {
        const field = getField(fieldName, form, categories, builtInFields, commonFields, relations);
        if (field) fields[fieldName] = field;
        return fields;
    }, clonedForm.fields ?? {});

    return clonedForm;
}


function getFieldNames(form: TransientFormDefinition, categories: Map<TransientCategoryDefinition>,
                       extendedForm?: TransientFormDefinition): string[] {

    if (!form.groups) return [];

    const minimalForm: BuiltInFormDefinition|undefined = categories[form.categoryName]?.minimalForm;

    const parentForm: BuiltInFormDefinition|undefined = categories[form.categoryName]?.parent
        ? categories[categories[form.categoryName].parent].minimalForm
        : form.parent
            ? categories[form.parent].minimalForm
            : undefined;

    return set(
        flatten(form.groups.map(to('fields')))
            .concat(minimalForm ? flatten(minimalForm.groups.map(to('fields'))) : [])
            .concat(parentForm ? flatten(parentForm.groups.map(to('fields'))) : [])
            .concat(extendedForm ? flatten(extendedForm.groups.map(to('fields'))) : [])
    );
}

/**
 * @returns the field definition or undefined if the field is a relation
 */
function getField(fieldName: string, form: TransientFormDefinition, categories: Map<TransientCategoryDefinition>,
                  builtInFields: Map<BuiltInFieldDefinition>, commonFields: Map<BuiltInFieldDefinition>,
                  relations: Array<Relation>): TransientFieldDefinition|undefined {
    
    const parentName: string|undefined = form.parent ?? categories[form.categoryName]?.parent;

    const parentCategoryFields: Map<BuiltInFieldDefinition> = parentName
        ? categories[parentName].fields
        : {};

    const field: TransientFieldDefinition = builtInFields[fieldName] as TransientFieldDefinition
        ?? commonFields[fieldName] as TransientFieldDefinition
        ?? parentCategoryFields[fieldName] as TransientFieldDefinition
        ?? categories[form.categoryName]?.fields[fieldName] as TransientFieldDefinition
        ?? (form.fields ? form.fields[fieldName] : undefined);

    if (!field && !relations.find(relation => relation.name === fieldName)) {
        throw [[ConfigurationErrors.FIELD_NOT_FOUND, form.categoryName, fieldName]];
    }

    if (field) field.name = fieldName;

    return field;
}
