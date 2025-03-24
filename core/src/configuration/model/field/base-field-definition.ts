import { Field } from '../../../model/configuration/field';
import { Named } from '../../../tools';


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: boolean;
    fulltextIndexed?: boolean;
    source?: Field.SourceType;
    references?: string[];
    subfields?: Array<BaseSubfieldDefinition>;
    dateConfiguration?: DateConfiguration;
}


export interface BaseSubfieldDefinition extends Named {

    inputType?: string;
    references?: string[];
    condition?: BaseSubfieldConditionDefinition;
}


export interface BaseSubfieldConditionDefinition {

    subfieldName: string;
    values: string[]|boolean;
}


export interface DateConfiguration {

    dataType: DateConfiguration.DataType;
    inputMode: DateConfiguration.InputMode;
}


export module DateConfiguration {

    export type DataType = 'date'|'dateTime'|'optional';
    export type InputMode = 'single'|'range'|'optional';


    export module DataType {
        
        export const DATE = 'date';
        export const DATE_TIME = 'dateTime';
        export const OPTIONAL = 'optional';
    }


    export module InputMode {
        
        export const SINGLE = 'single';
        export const RANGE = 'range';
        export const OPTIONAL = 'optional';
    }


    export function getDefault(): DateConfiguration {

        return {
            dataType: DataType.OPTIONAL,
            inputMode: InputMode.SINGLE
        };
    }
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
