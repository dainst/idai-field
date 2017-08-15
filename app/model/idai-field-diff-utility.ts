import {IdaiFieldResource} from 'idai-components-2/idai-field-model';
import {ObjectUtil} from "../util/object-util";

/**
 * @author Thomas Kleinke
 */
export class IdaiFieldDiffUtility {

    public static findDifferingFields(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        let fieldsToIgnore: string[] = ['geometry', 'georeference', 'relations'];

        let differingFieldsNames: string[] = ObjectUtil.findDifferingFieldsInObject(resource1, resource2, fieldsToIgnore)
            .concat(ObjectUtil.findDifferingFieldsInObject(resource2, resource1, fieldsToIgnore));

        if (!ObjectUtil.compareObjects(resource1.geometry, resource2.geometry)) {
            differingFieldsNames.push('geometry');
        }

        if (!ObjectUtil.compareObjects(resource1.georeference, resource2.georeference)) {
            differingFieldsNames.push('georeference');
        }

        return ObjectUtil.removeDuplicateValues(differingFieldsNames);
    }

    public static findDifferingRelations(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        let differingRelationNames: string[]
            = ObjectUtil.findDifferingFieldsInObject(resource1.relations, resource2.relations, [])
                .concat(ObjectUtil.findDifferingFieldsInObject(resource2.relations, resource1.relations, []));

        return ObjectUtil.removeDuplicateValues(differingRelationNames);
    }


}
