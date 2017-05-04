import {IdaiFieldResource} from '../model/idai-field-resource';

/**
 * @author Thomas Kleinke
 */
export class DiffUtility {

    public static findDifferingFields(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        let fieldsToIgnore: string[] = ['geometry', 'georeference', 'relations'];

        let differingFieldsNames: string[] = this.findDifferingFieldsInObject(resource1, resource2, fieldsToIgnore)
            .concat(this.findDifferingFieldsInObject(resource2, resource1, fieldsToIgnore));

        return this.removeDuplicateValues(differingFieldsNames);
    }

    public static findDifferingRelations(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        let differingRelationNames: string[]
            = this.findDifferingFieldsInObject(resource1.relations, resource2.relations, [])
                .concat(this.findDifferingFieldsInObject(resource2.relations, resource1.relations, []));

        return this.removeDuplicateValues(differingRelationNames);
    }

    private static findDifferingFieldsInObject(object1: any, object2: any, fieldsToIgnore: string[]): string[] {

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

    private static compareFields(field1: any, field2: any): boolean {

        if (!field1 || !field2) return false;
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

    private static removeDuplicateValues(array: any[]): any[] {

        let result: any[] = [];

        for (let value of array) {
            if (result.indexOf(value) == -1) result.push(value);
        }

        return result;
    }
}
