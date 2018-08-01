/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ObjectUtil {

    // TODO move to tsfun
    export function getElForPathIn(object: any, path: string) {

        let result = object;
        for (let segment of path.split('.')) {
            if (result[segment] || result[segment] === false) result = result[segment];
            else return result = undefined;
        }
        return result;
    }

    // TODO move to tsfun
    export function takeOrMake(object: Object, path: string, val: any) {

        if (getElForPathIn(object, path)) return getElForPathIn(object, path);
        let result: any = object;
        let last;
        let lastSegment: any;
        for (let segment of path.split('.')) {
            if (!result[segment]) result[segment] = { };
            last = result;
            lastSegment = segment;
            result = result[segment];
        }
        return last[lastSegment] = val;
    }


    // TODO make global
    /**
     * Clones the object, keeping the type of Date objects as Date.
     *
     * @param {O} object
     * @returns {O}
     */
    export function cloneObject<O>(object: O): O {

        return (function convertDates<O>(original: any, plain: any) {

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

        })(object, JSON.parse(JSON.stringify(object))) as O;
    }

    // TODO move to tsfun / predicates
    export function isEmpty(object: Object): boolean {

        return Object.keys(object).length == 0;
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

        if (type1 != type2) {
            return false;
        } else if (type1 == 'object') {
            return compareObjects(value1, value2);
        } else if (type1 == 'array') {
            return compareArrays(value1, value2);
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

        if (field1 instanceof Array) return compareArrays(field1, field2);

        return field1 === field2;
    }


    export function compareArrays(array1: any[], array2: any[]): boolean {

        if (array1.length != array2.length) return false;

        for (let element of array1) {
            if (!isInArray(array2, element)) return false;
        }

        for (let element of array2) {
            if (!isInArray(array1, element)) return false;
        }

        return true;
    }


    export function isInArray(array: any[], value: any): boolean {

        return array.find(element => compareObjects(element, value)) != undefined;
    }


    export function getType(value: any): string {

        return typeof value == 'object'
            ? value instanceof Array
                ? 'array'
                : 'object'
            : 'flat';
    }
}
