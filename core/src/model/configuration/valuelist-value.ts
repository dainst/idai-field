import { I18N } from '../../tools';
import { Reference } from './reference';


export interface ValuelistValue extends I18N.Labeled, I18N.Described {

    references?: Array<Reference>;
}
