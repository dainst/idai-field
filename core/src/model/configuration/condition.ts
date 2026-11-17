import { intersect, isArray } from 'tsfun';
import { BaseField } from './field';


export interface Condition {

    fieldName?: string;
    subfieldName?: string;
    values?: string[]|boolean;
    exists?: true;
}


export module Condition {

    export function isValid(condition: Condition, type: 'field'|'subfield'): boolean {

        return condition
            && condition[type + 'Name']
            && (condition.values === true
                || condition.values === false
                || (isArray(condition.values) && condition.values.length > 0)
                || condition.exists
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
            ? condition.exists
                ? true
                : isArray(condition.values)
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
        
        const condition: Condition = {};
        
        if (type === 'field') {
            condition.fieldName = '';
        } else {
            condition.subfieldName = '';
        }

        return condition;
    }


    export function generateLabel(condition: Condition, translate: (term: string) => string,
                                  getValueLabel: (valueId: string) => string) {

        if (!condition) return '';

        if (condition.exists) {
            return translate('condition.filledIn');
        } else if (condition.values === true) {
            return translate('true');
        } else if (condition.values === false) {
            return translate('false');
        } else {
            return condition.values.map(valueId => getValueLabel(valueId)).join(', ');
        }
    }
}
