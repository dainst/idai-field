import { I18N, Name } from '../../../tools';
import { ConfigurationErrors } from '../../boot/configuration-errors';
import { BaseFormDefinition, BaseGroupDefinition } from './base-form-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface LibraryFormDefinition extends BaseFormDefinition {

    categoryName: string;
    description: I18N.String,
    createdBy: string,
    creationDate: string;
    groups: Array<BaseGroupDefinition>;
}


export namespace LibraryFormDefinition {

    export function makeAssertIsValid(categoryNames: string[]) {

        return function assertIsValid([formName, form]: [Name, LibraryFormDefinition]) {

            if (form.description === undefined) throw [ConfigurationErrors.MISSING_FORM_PROPERTY, 'description', formName];
            if (form.creationDate === undefined) throw [ConfigurationErrors.MISSING_FORM_PROPERTY, 'creationDate', formName];
            if (form.createdBy === undefined) throw [ConfigurationErrors.MISSING_FORM_PROPERTY, 'createdBy', formName];
            if (form.categoryName === undefined) throw [ConfigurationErrors.MISSING_FORM_PROPERTY, 'categoryName', formName];
            if (form.groups === undefined) throw [ConfigurationErrors.MISSING_FORM_PROPERTY, 'groups', formName];

            if (!categoryNames.includes(form.categoryName)) throw [ConfigurationErrors.CATEGORY_NAME_NOT_FOUND, form.categoryName, formName];
        }
    }
}
