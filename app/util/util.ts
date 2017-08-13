/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Util {

    public static getElForPathIn(object, path) {

        let result = object;
        for (let segment of path.split('.')) {
            if (result[segment]) result = result[segment];
            else return result = undefined;
        }
        return result;
    }

    public static takeOrMake(object: Object, path: string, val: any) {

        return Util.getElForPathIn(object, path)
            ? Util.getElForPathIn(object, path) : val;
    }

    public static findDifferingFieldsInObject(object1: any, object2: any, fieldsToIgnore: string[]): string[] {

        let differingFieldsNames: string[] = [];

        for (let fieldName in object1) {
            if (object1.hasOwnProperty(fieldName)) {
                if (fieldsToIgnore.indexOf(fieldName) > -1) continue;
                if (!this.compareFields(object1[fieldName], object2[fieldName])) {
                    differingFieldsNames.push(fieldName);
                }
            }
        }
        return differingFieldsNames;
    }

    public static compareFields(field1: any, field2: any): boolean {

        if ((field1 && !field2) || (!field1 && field2)) return false;
        if (field1 instanceof Array && !(field2 instanceof Array)) return false;
        if (!(field1 instanceof Array) && field2 instanceof Array) return false;

        if (field1 instanceof Array) return this.compareArrays(field1, field2);

        return field1 === field2;
    }

    private static compareArrays(array1: any[], array2: any[]): boolean {

        if (array1.length != array2.length) return false;

        for (let i in array1) {
            if (array2.indexOf(array1[i]) == -1) return false;
        }

        for (let i in array2) {
            if (array1.indexOf(array2[i]) == -1) return false;
        }

        return true;
    }

    public static removeDuplicateValues(array: any[]): any[] {

        let result: any[] = [];

        for (let value of array) {
            if (result.indexOf(value) == -1) result.push(value);
        }

        return result;
    }
}
