import {arrayEquivalentBy, jsonEquals} from 'tsfun';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ComparisonUtil {

    // TODO move to tsfun
    export function getDuplicateValues(array: any[]): any[] {

        const temp: any[] = [];
        const result: any[] = [];

        for (let value of array) {
            if (temp.indexOf(value) > -1 && result.indexOf(value) == -1) {
                result.push(value);
            } else {
                temp.push(value);
            }
        }

        return result;
    }


    export function findDifferingFieldsInObject(object1: Object, object2: Object, fieldsToIgnore?: string[]): string[] {

        const differingFieldsNames: string[] = [];

        for (let fieldName in object1) {
            if (object1.hasOwnProperty(fieldName)) {

                if (fieldsToIgnore && fieldsToIgnore.indexOf(fieldName) > -1) continue;

                if (!ComparisonUtil.compare(
                    (object1 as any)[fieldName],
                    (object2 as any)[fieldName])) differingFieldsNames.push(fieldName);
            }
        }
        return differingFieldsNames;
    }


    export function compare(value1: any, value2: any): boolean {

        if (!value1 && !value2) return true;
        if ((value1 && !value2) || (!value1 && value2)) return false;

        const type1: string = ComparisonUtil.getType(value1);
        const type2: string = ComparisonUtil.getType(value2);

        if (type1 !== type2) {
            return false;
        } else if (type1 === 'object') {
            return jsonEquals(value1)(value2);
        } else if (type1 === 'array') {
            return arrayEquivalentBy(jsonEquals)(value1)(value2);
        } else {
            return compareFields(value1, value2);
        }
    }


    export function compareFields(field1: any, field2: any): boolean {

        if (field1 instanceof Array && !(field2 instanceof Array)) return false;
        if (!(field1 instanceof Array) && field2 instanceof Array) return false;

        if (field1 instanceof Array) return arrayEquivalentBy(jsonEquals)(field1)(field2);

        return field1 === field2;
    }


    export function getType(value: any): string {

        return typeof value == 'object'
            ? value instanceof Array
                ? 'array'
                : 'object'
            : 'flat';
    }
}
