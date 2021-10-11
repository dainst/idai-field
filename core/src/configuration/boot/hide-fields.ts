import { clone, Map } from 'tsfun';
import { TransientFormDefinition } from '../model/form/transient-form-definition';


export function hideFields(forms: Map<TransientFormDefinition>): Map<TransientFormDefinition> {

    const clonedForms = clone(forms);

    Object.values(clonedForms).forEach(form => {
        if (!form.fields) return;

        Object.keys(form.fields).forEach(fieldName => {
            if (form.hidden && form.hidden.includes(fieldName)) {
                form.fields[fieldName].visible = false;
                form.fields[fieldName].editable = false;
            }

            if (form.fields[fieldName].visible === undefined) form.fields[fieldName].visible = true;
            if (form.fields[fieldName].editable === undefined) form.fields[fieldName].editable = true;
        })
    });

    return clonedForms;
}
