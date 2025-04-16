import { intersect, isArray } from 'tsfun';
import { BaseField } from './field';


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


    export function isFulfilled(condition: Condition, fieldContainer: any, fields: Array<BaseField>,
                                type: 'field'|'subfield'): boolean {
        
        if (!condition) return true;

        const conditionField: BaseField = fields.find(field => {
            return field.name === condition[type + 'Name'];
        });

        const data: any = fieldContainer[conditionField.name];
        const fulfilled: boolean = data !== undefined
            ? isArray(condition.values)
                ? isArray(data)
                    ? intersect(data)(condition.values).length > 0
                    : condition.values.includes(data)
                : data === condition.values
            : false;

        return fulfilled
            ? conditionField.condition
                ? isFulfilled(conditionField.condition, fieldContainer, fields, type)
                : true
            : false
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
