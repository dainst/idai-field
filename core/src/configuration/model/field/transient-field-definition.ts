import { Valuelist } from '../../../model/configuration/valuelist';
import { I18N } from '../../../tools/i18n';
import { BuiltInFieldDefinition } from './built-in-field-definition';
import { LibrarySubfieldDefinition } from './library-field-definition';


export interface TransientFieldDefinition extends BuiltInFieldDefinition, I18N.LabeledValue, I18N.Described {

    valuelist?: Valuelist;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
    defaultConstraintIndexed?: boolean;
    subfields?: Array<TransientSubfieldDefinition>;
}


export interface TransientSubfieldDefinition extends LibrarySubfieldDefinition, I18N.LabeledValue, I18N.Described {
    
    valuelist?: Valuelist;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
}



export module TransientFieldDefinition {

    export const VALUELIST = 'valuelist';
    export const VALUELISTID = 'valuelistId';
}
