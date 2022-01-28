import { Field } from '../../../model/configuration/field';
import { Valuelists } from '../../../model/configuration/valuelist';


export interface BaseFormDefinition {

    groups?: Array<BaseGroupDefinition>;
    valuelists?: Valuelists;
    source?: Field.SourceType;
    references?: string[];
}


export module BaseFormDefinition {

    export const GROUPS = 'groups';
}


export interface BaseGroupDefinition {

    name: string;
    fields: string[];
}
