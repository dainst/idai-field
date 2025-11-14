import { Condition } from '../../../model/configuration/condition';
import { DateConfiguration } from '../../../model/configuration/date-configuration';
import { Field } from '../../../model/configuration/field';
import { SemanticReference } from '../../../model/configuration/semantic-reference';
import { Named } from '../../../tools/named';


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: boolean;
    fulltextIndexed?: boolean;
    source?: Field.SourceType;
    references?: string[];
    semanticReferences?: Array<SemanticReference>;
    condition?: Condition;
    subfields?: Array<BaseSubfieldDefinition>;
    dateConfiguration?: DateConfiguration;
}


export interface BaseSubfieldDefinition extends Named {

    inputType?: string;
    references?: string[];
    semanticReferences?: Array<SemanticReference>;
    condition?: Condition;
    dateConfiguration?: DateConfiguration;
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
