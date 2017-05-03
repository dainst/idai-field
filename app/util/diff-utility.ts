import {IdaiFieldResource} from '../model/idai-field-resource';

/**
 * @author Thomas Kleinke
 */
export class DiffUtility {

    public static findDifferingFields(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        var differingFieldsNames = [];

        for (let fieldName in resource1) {
            if (resource1.hasOwnProperty(fieldName)) {
                // TODO Include geometry, georeference & relations
                if (fieldName == 'geometry' || fieldName == 'georeference' || fieldName == 'relations') continue;
                if (!this.compareFields(resource1[fieldName], resource2[fieldName])) {
                    differingFieldsNames.push(fieldName);
                }
            }
        }

        return differingFieldsNames;
    }

    private static compareFields(field1: any, field2: any): boolean {

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
}
