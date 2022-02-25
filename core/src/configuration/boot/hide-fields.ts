import { clone, Map } from 'tsfun';
import { TransientFieldDefinition } from '../model/field/transient-field-definition';
import { TransientFormDefinition } from '../model/form/transient-form-definition';


export function hideFields(forms: Map<TransientFormDefinition>): Map<TransientFormDefinition> {

    const clonedForms = clone(forms);

    Object.values(clonedForms).forEach(form => {
        if (!form.fields) return;

        applyHiddenForFields(Object.values(form.fields), form.hidden);
    });

    return clonedForms;
}


export function applyHiddenForFields(fields: Array<TransientFieldDefinition>, hidden: string[]) {

    fields.forEach(field => applyHiddenForField(field, hidden));
}


export function applyHiddenForField(field: TransientFieldDefinition,
                                    hidden: string[]) {

    if (hidden && hidden.includes(field.name)) {
        field.visible = false;
        field.editable = false;
    }

    if (field.visible === undefined) field.visible = true;
    if (field.editable === undefined) field.editable = true;
}
