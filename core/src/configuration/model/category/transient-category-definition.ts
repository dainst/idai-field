import { Map } from 'tsfun';
import { Named } from '../../../tools/named';
import { TransientFieldDefinition } from '../field/transient-field-definition';
import { TransientFormDefinition } from '../form/transient-form-definition';
import { BuiltInCategoryDefinition } from './built-in-category-definition';
import { LibraryCategoryDefinition } from './library-category-definition';

export interface TransientCategoryDefinition extends BuiltInCategoryDefinition, LibraryCategoryDefinition, Named {

    fields: Map<TransientFieldDefinition>;
    minimalForm: TransientFormDefinition;
}
