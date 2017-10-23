/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ObjectUtil {


    public static getElForPathIn(object: any, path: string) {

        let result = object;
        for (let segment of path.split('.')) {
            if (result[segment]) result = result[segment];
            else return result = undefined;
        }
        return result;
    }


    public static takeOrMake(object: Object, path: string, val: any) {

        if (ObjectUtil.getElForPathIn(object, path)) return ObjectUtil.getElForPathIn(object, path);
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


    public static cloneObject(object: Object): Object {

        return JSON.parse(JSON.stringify(object));
    }


    public static isEmpty(object: Object): boolean {

        return Object.keys(object).length == 0;
    }


    public static getDuplicateValues(array: any[]): any[] {

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


    public static removeDuplicateValues(array: any[]): any[] {

        const result: any[] = [];

        for (let value of array) {
            if (result.indexOf(value) == -1) result.push(value);
        }

        return result;
    }


    public static findDifferingFieldsInObject(object1: Object, object2: Object, fieldsToIgnore?: string[]): string[] {

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


    public static compare(value1: any, value2: any): boolean {

        if (!value1 && !value2) return true;
        if ((value1 && !value2) || (!value1 && value2)) return false;

        const type1: string = ObjectUtil.getType(value1);
        const type2: string = ObjectUtil.getType(value2);

        if (type1 != type2) {
            return false;
        } else if (type1 == 'object') {
            return this.compareObjects(value1, value2);
        } else if (type1 == 'array') {
            return this.compareArrays(value1, value2);
        } else {
            return this.compareFields(value1, value2);
        }
    }


    private static compareObjects(object1: Object, object2: Object): boolean {

        return JSON.stringify(object1) == JSON.stringify(object2);
    }


    private static compareFields(field1: any, field2: any): boolean {

        if (field1 instanceof Array && !(field2 instanceof Array)) return false;
        if (!(field1 instanceof Array) && field2 instanceof Array) return false;

        if (field1 instanceof Array) return this.compareArrays(field1, field2);

        return field1 === field2;
    }


    private static compareArrays(array1: any[], array2: any[]): boolean {

        if (array1.length != array2.length) return false;

        for (let element of array1) {
            if (!ObjectUtil.isInArray(array2, element)) return false;
        }

        for (let element of array2) {
            if (!ObjectUtil.isInArray(array1, element)) return false;
        }

        return true;
    }


    private static isInArray(array: any[], value: any): boolean {

        for (let element of array) {
            if (ObjectUtil.compareObjects(element, value)) return true;
        }

        return false;
    }


    private static getType(value: any): string {

        if (typeof value == 'object') {
            if (value instanceof Array) {
                return 'array';
            } else {
                return 'object';
            }
        } else {
            return 'flat';
        }
    }
}
