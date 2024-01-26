import { clone, flatten, Map, set, to } from 'tsfun';
import { Field } from '../../model/configuration/field';
import { Relation } from '../../model/configuration/relation';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { CustomFieldDefinition } from '../model/field/custom-field-definition';
import { TransientFieldDefinition } from '../model/field/transient-field-definition';
import { BuiltInFormDefinition } from '../model/form/built-in-form-definition';
import { CustomFormDefinition } from '../model/form/custom-form-definition';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { ConfigurationErrors } from './configuration-errors';


/**
 * 
 * @author Thomas Kleinke 
 */
export function addFieldsToForm(form: TransientFormDefinition, categories: Map<TransientCategoryDefinition>,
                                builtInFields: Map<Field>, commonFields: Map<Field>,
                                relations: Array<Relation>, parentForm?: CustomFormDefinition,
                                extendedForm?: TransientFormDefinition): TransientFormDefinition {

    const fieldNames: string[] = getFieldNames(form, categories, extendedForm);

    const clonedForm: TransientFormDefinition = clone(form);
    if (extendedForm) Object.assign(clonedForm.fields, extendedForm.fields);

    clonedForm.fields = fieldNames.reduce((fields, fieldName) => {
        const field = getField(
            fieldName, form, categories, builtInFields, commonFields, relations,
            parentForm, extendedForm
        );
        if (field) fields[fieldName] = field;
        return fields;
    }, clonedForm.fields ?? {});

    if (parentForm) {
        if (!clonedForm.valuelists) clonedForm.valuelists = {};
        for (let fieldName of Object.keys(parentForm.valuelists ?? {})) {
            clonedForm.valuelists[fieldName] = parentForm.valuelists[fieldName];
        }
    }

    applyFormChanges(clonedForm, form, parentForm, extendedForm);

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
                  builtInFields: Map<Field>, commonFields: Map<Field>, relations: Array<Relation>,
                  parentForm?: CustomFormDefinition, extendedForm?: TransientFormDefinition): Field|undefined {
    
    const parentName: string|undefined = form.parent ?? categories[form.categoryName]?.parent;

    const parentCategoryFields: Map<Field> = parentName
        ? categories[parentName].fields as Map<Field>
        : {};

    const field: Field = builtInFields[fieldName]
        ?? commonFields[fieldName]
        ?? parentCategoryFields[fieldName]
        ?? categories[form.categoryName]?.fields[fieldName] as Field
        ?? (parentForm?.fields ? parentForm.fields[fieldName] as Field : undefined)
        ?? (extendedForm?.fields ? extendedForm.fields[fieldName] as Field : undefined)
        ?? (form.fields ? form.fields[fieldName] as Field : undefined);

    if ((!field || !field.inputType) && !relations.find(relation => relation.name === fieldName)) {
        throw [[ConfigurationErrors.FIELD_NOT_FOUND, form.categoryName, fieldName]];
    }

    if (field && !field.name) field.name = fieldName;

    return clone(field);
}


function applyFormChanges(clonedForm: TransientFormDefinition, form: TransientFormDefinition,
                          parentForm?: CustomFormDefinition, extendedForm?: CustomFormDefinition) {

    if (extendedForm?.fields) {
        Object.keys(extendedForm.fields).forEach(fieldName => {
            applyFieldChanges(clonedForm.fields[fieldName], extendedForm.fields[fieldName]);
        });
    }

    if (form.fields) {
        Object.keys(form.fields).forEach(fieldName => {
            applyFieldChanges(clonedForm.fields[fieldName], form.fields[fieldName]);
        });
    }

    if (parentForm?.fields) {
        Object.keys(parentForm.fields).forEach(fieldName => {
            applyFieldChanges(clonedForm.fields[fieldName], parentForm.fields[fieldName]);
        });
    }
}


function applyFieldChanges(field: TransientFieldDefinition, changedField: CustomFieldDefinition) {

    if (!field || !changedField) return;

    if (changedField.inputType) {
        field.inputType = changedField.inputType as Field.InputType;
    }

    if (changedField.constraintIndexed !== undefined) {
        field.constraintIndexed = changedField.constraintIndexed;
    }
}
