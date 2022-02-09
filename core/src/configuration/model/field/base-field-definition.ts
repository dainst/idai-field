import { Field } from '../../../model/configuration/field';


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: boolean;
    fulltextIndexed?: boolean;
    source?: Field.SourceType;
    references?: string[];
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
