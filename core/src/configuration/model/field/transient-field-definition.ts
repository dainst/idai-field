import { Valuelist } from '../../../model/configuration/valuelist';
import { I18N } from '../../../tools/i18n';
import { Named } from '../../../tools/named';
import { BuiltInFieldDefinition } from './built-in-field-definition';
import { LibraryFieldDefinition } from './library-field-definition';


export interface TransientFieldDefinition extends BuiltInFieldDefinition, LibraryFieldDefinition, Named {

    valuelist?: Valuelist;
    valuelistId?: string,
    valuelistFromProjectField?: string;
    defaultConstraintIndexed?: boolean;
    label?: I18N.String;
    description?: I18N.String;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
}


export module TransientFieldDefinition {

    export const VALUELIST = 'valuelist';
    export const VALUELISTID = 'valuelistId';
    export const POSITION_VALUES = 'positionValues';    // TODO Check if both of these are necessary
    export const POSITION_VALUELIST_ID = 'positionValuelistId';
}
