import {IdaiFieldResource} from 'idai-components-2/idai-field-model';
import {Util} from "../util/util";
const deepEqual = require('deep-equal');

/**
 * @author Thomas Kleinke
 */
export class DiffUtility {

    public static findDifferingFields(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        let fieldsToIgnore: string[] = ['geometry', 'georeference', 'relations'];

        let differingFieldsNames: string[] = Util.findDifferingFieldsInObject(resource1, resource2, fieldsToIgnore)
            .concat(Util.findDifferingFieldsInObject(resource2, resource1, fieldsToIgnore));

        if (!DiffUtility.compareObjects(resource1.geometry, resource2.geometry)) {
            differingFieldsNames.push('geometry');
        }

        if (!DiffUtility.compareObjects(resource1.georeference, resource2.georeference)) {
            differingFieldsNames.push('georeference');
        }

        return Util.removeDuplicateValues(differingFieldsNames);
    }

    public static findDifferingRelations(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        let differingRelationNames: string[]
            = Util.findDifferingFieldsInObject(resource1.relations, resource2.relations, [])
                .concat(Util.findDifferingFieldsInObject(resource2.relations, resource1.relations, []));

        return Util.removeDuplicateValues(differingRelationNames);
    }

    public static compareObjects(object1: any, object2: any): boolean {

        if (!object1 && !object2) return true;

        if ((object1 && !object2) || (!object1 && object2)) return false;

        return deepEqual(object1, object2);
    }
}
