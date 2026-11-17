import { Map } from 'tsfun';
import { I18N } from '../../../tools/i18n';
import { Named } from '../../../tools/named';
import { TransientFieldDefinition } from '../field/transient-field-definition';
import { BaseGroupDefinition } from './base-form-definition';
import { BuiltInFormDefinition } from './built-in-form-definition';
import { CustomFormDefinition } from './custom-form-definition';
import { LibraryFormDefinition } from './library-form-definition';


export interface TransientFormDefinition extends BuiltInFormDefinition, LibraryFormDefinition, CustomFormDefinition,
                                                 Named {

    fields: Map<TransientFieldDefinition>;
    groups: Array<BaseGroupDefinition>;
    originalGroups?: Array<BaseGroupDefinition>;
    label?: I18N.String;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
    defaultColor?: string;
    customFields?: string[]
}


export module TransientFormDefinition {

    export const FIELDS = 'fields';
}
