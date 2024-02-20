import { Map } from 'tsfun';
import { I18N } from '../../tools/i18n';
import { Field } from './field';


export interface Category {

    name: string;
    parent?: string;

    label: I18N.String;
    defaultLabel?: I18N.String;
    description: I18N.String;
    defaultDescription?: I18N.String;

    fields: Map<Field>;

    isAbstract?: boolean;
    mustLieWithin?: boolean;
    userDefinedSubcategoriesAllowed?: boolean;
    scanCodesAllowed?: boolean;
    required?: boolean;

    color?: string;
}
