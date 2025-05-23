import { Condition } from '../../../model/configuration/condition';
import { DateConfiguration } from '../../../model/configuration/date-configuration';
import { Field } from '../../../model/configuration/field';
import { Named } from '../../../tools';


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: boolean;
    fulltextIndexed?: boolean;
    source?: Field.SourceType;
    references?: string[];
    condition?: Condition;
    subfields?: Array<BaseSubfieldDefinition>;
    dateConfiguration?: DateConfiguration;
}


export interface BaseSubfieldDefinition extends Named {

    inputType?: string;
    references?: string[];
    condition?: Condition;
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
