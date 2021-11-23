import { I18N } from '../../tools';


export interface ValuelistValue extends I18N.Labeled {

    references?: { [referenceKey: string]: string },
}
