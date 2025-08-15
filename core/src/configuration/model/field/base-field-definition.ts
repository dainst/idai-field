import { Condition } from '../../../model/configuration/condition';
import { DateConfiguration } from '../../../model/configuration/date-configuration';
import { Field } from '../../../model/configuration/field';
import { Reference } from '../../../model/configuration/reference';
import { Named } from '../../../tools/named';


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: boolean;
    fulltextIndexed?: boolean;
    source?: Field.SourceType;
    references?: Array<Reference>;
    condition?: Condition;
    subfields?: Array<BaseSubfieldDefinition>;
    dateConfiguration?: DateConfiguration;
}


export interface BaseSubfieldDefinition extends Named {

    inputType?: string;
    references?: Array<Reference>;
    condition?: Condition;
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
