import { I18N } from '../../tools';


export interface ValuelistValue extends I18N.Labeled, I18N.Described {

    references?: { [referenceKey: string]: string },
}
