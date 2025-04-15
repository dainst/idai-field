import { isArray } from 'tsfun';


export interface Condition {

    fieldName?: string;
    subfieldName?: string;
    values: string[]|boolean;
}


export module Condition {

    export function isValid(condition: Condition, type: 'field'|'subfield'): boolean {

        return condition
            && condition[type + 'Name']
            && (condition.values === true
                || condition.values === false
                || isArray(condition.values) && condition.values.length > 0
            );
    }


    export function getEmpty(type: 'field'|'subfield'): Condition {
        
        const condition: Condition = {
            values: undefined
        };
        
        if (type === 'field') {
            condition.fieldName = '';
        } else {
            condition.subfieldName = '';
        }

        return condition;
    }
}
