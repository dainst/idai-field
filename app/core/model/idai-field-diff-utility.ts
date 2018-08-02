import {IdaiFieldResource} from 'idai-components-2/field';
import {ObjectUtil} from '../../util/object-util';
import {unique} from "tsfun";
import {ComparisonUtil} from "../../util/comparison-util";

/**
 * @author Thomas Kleinke
 */
export class IdaiFieldDiffUtility {

    public static findDifferingFields(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        const fieldsToIgnore: string[] = ['relations'];

        let differingFieldsNames: string[]
            = ComparisonUtil.findDifferingFieldsInObject(resource1, resource2, fieldsToIgnore)
                .concat(ComparisonUtil.findDifferingFieldsInObject(resource2, resource1, fieldsToIgnore));

        return unique(differingFieldsNames);
    }


    public static findDifferingRelations(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        let differingRelationNames: string[]
            = ComparisonUtil.findDifferingFieldsInObject(resource1.relations, resource2.relations)
                .concat(ComparisonUtil.findDifferingFieldsInObject(resource2.relations, resource1.relations));

        return unique(differingRelationNames);
    }
}
