import { Field } from '../../../model/configuration/field';
import { Valuelists } from '../../../model/configuration/valuelist';


export interface BaseFormDefinition {

    color?: string;
    groups?: Array<BaseGroupDefinition>;
    valuelists?: Valuelists;
    source?: Field.SOURCE_TYPES;
}


export module BaseFormDefinition {

    export const GROUPS = 'groups';
}


export interface BaseGroupDefinition {

    name: string;
    fields: string[];
}
