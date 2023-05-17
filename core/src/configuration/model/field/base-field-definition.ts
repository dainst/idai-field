import { Map } from 'tsfun';
import { Field } from '../../../model/configuration/field';


export interface BaseFieldDefinition extends BaseSubfieldDefinition {

    constraintIndexed?: boolean;
    fulltextIndexed?: boolean;
    source?: Field.SourceType;
    references?: string[];
    subfields?: Map<BaseSubfieldDefinition>;
}


export interface BaseSubfieldDefinition {

    inputType?: string;
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
