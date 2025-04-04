/**
 * @author Thomas Kleinke
 */
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
            inputMode: InputMode.OPTIONAL
        };
    }
}
