import { Map } from 'tsfun';
import { Field } from '../../../model/configuration/field';
import { I18N } from '../../../tools/i18n';
import { Named } from '../../../tools/named';
import { TransientFieldDefinition } from '../field/transient-field-definition';
import { TransientFormDefinition } from '../form/transient-form-definition';
import { BuiltInCategoryDefinition } from './built-in-category-definition';
import { LibraryCategoryDefinition } from './library-category-definition';

export interface TransientCategoryDefinition extends BuiltInCategoryDefinition, LibraryCategoryDefinition, Named {

    fields: Map<TransientFieldDefinition|Field>;
    minimalForm: TransientFormDefinition;
    
    label?: I18N.String;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
}
