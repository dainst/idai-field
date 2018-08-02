import {equals, equalTo, clone} from 'tsfun';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ObjectUtil {

    // TODO make global, add more general version of it to tsfun
    /**
     * Clones the object, keeping the type of Date objects as Date.
     *
     * @param {O} object
     * @returns {O}
     */
    export function cloneObject<O>(object: O): O {

        return clone(object, convertDates);
    }


    function convertDates<O>(original: any, plain: any) {

        if (original) {
            for (let key of Object.keys(original)) {

                if (original[key] instanceof Date) {
                    plain[key] = new Date(original[key]);
                } else if (typeof original[key] === 'object') {
                    convertDates(original[key], plain[key])
                }

            }
        }
        return plain;

    }


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

                if (!ObjectUtil.compare(
                    (object1 as any)[fieldName],
                    (object2 as any)[fieldName])) differingFieldsNames.push(fieldName);
            }
        }
        return differingFieldsNames;
    }


    export function compare(value1: any, value2: any): boolean {

        if (!value1 && !value2) return true;
        if ((value1 && !value2) || (!value1 && value2)) return false;

        const type1: string = ObjectUtil.getType(value1);
        const type2: string = ObjectUtil.getType(value2);

        if (type1 !== type2) {
            return false;
        } else if (type1 === 'object') {
            return compareObjects(value1, value2);
        } else if (type1 === 'array') {
            return equals(value1, value2, equalTo);
        } else {
            return compareFields(value1, value2);
        }
    }


    export function compareObjects(object1: Object, object2: Object): boolean {

        return JSON.stringify(object1) == JSON.stringify(object2);
    }


    export function compareFields(field1: any, field2: any): boolean {

        if (field1 instanceof Array && !(field2 instanceof Array)) return false;
        if (!(field1 instanceof Array) && field2 instanceof Array) return false;

        if (field1 instanceof Array) return equals(field1, field2, equalTo);

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
