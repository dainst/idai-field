import { Field } from '../../../model/configuration/field';
import { Reference } from '../../../model/configuration/reference';
import { Valuelists } from '../../../model/configuration/valuelist';


export interface BaseFormDefinition {

    groups?: Array<BaseGroupDefinition>;
    valuelists?: Valuelists;
    source?: Field.SourceType;
    references?: Array<Reference>;
}


export module BaseFormDefinition {

    export const GROUPS = 'groups';
}


export interface BaseGroupDefinition {

    name: string;
    fields: string[];
}
