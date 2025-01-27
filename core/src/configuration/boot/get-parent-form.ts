import { TransientFormDefinition } from '../model/form/transient-form-definition';


/**
 * @@author Thomas Kleinke
 */
export function getParentForm(form: TransientFormDefinition, forms: Array<TransientFormDefinition>,
                              selectedForms?: string[]): TransientFormDefinition|undefined {

    if (!form.parent) return;

    return forms.find(form2 => {
        return form2.categoryName === form.parent
            && (!selectedForms || selectedForms.includes(form2.name));
    });
}
