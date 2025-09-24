import { Field } from '../../../model/configuration/field';
import { SemanticReference } from '../../../model/configuration/semantic-reference';
import { Valuelists } from '../../../model/configuration/valuelist';


export interface BaseFormDefinition {

    groups?: Array<BaseGroupDefinition>;
    valuelists?: Valuelists;
    source?: Field.SourceType;
    references?: string[];
    semanticReferences?: Array<SemanticReference>;
}


export module BaseFormDefinition {

    export const GROUPS = 'groups';
}


export interface BaseGroupDefinition {

    name: string;
    fields: string[];
}
