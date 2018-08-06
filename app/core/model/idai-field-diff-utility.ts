import {IdaiFieldResource} from 'idai-components-2/field';
import {unique} from "tsfun";
import {ComparisonUtil} from "../../util/comparison-util";

/**
 * @author Thomas Kleinke
 */
export class IdaiFieldDiffUtility {

    public static findDifferingFields(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        const fieldsToIgnore: string[] = ['relations'];

        const differingFieldsNames: string[]
            = ComparisonUtil.findDifferingFieldsInResource(resource1, resource2, fieldsToIgnore)
                .concat(ComparisonUtil.findDifferingFieldsInResource(resource2, resource1, fieldsToIgnore));

        return unique(differingFieldsNames);
    }


    public static findDifferingRelations(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        const differingRelationNames: string[]
            = ComparisonUtil.findDifferingFieldsInRelations(resource1.relations, resource2.relations)
                .concat(ComparisonUtil.findDifferingFieldsInRelations(resource2.relations, resource1.relations));

        return unique(differingRelationNames);
    }
}
