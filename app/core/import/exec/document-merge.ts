import {Document, Resource} from 'idai-components-2';
import {clone} from '../../util/object-util';
import {isNot, includedIn} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module DocumentMerge {

    const PROTECTED_FIELDS = ['id', 'identifier', 'relations', 'type'];


    export function merge(into: Document, additional: Document, allowOverwriteRelationsOnMerge: boolean): Document {

        const clonedTarget = clone(into);

        clonedTarget.resource =
            Object.keys(additional.resource)
                .filter(isNot(includedIn(PROTECTED_FIELDS)))
                .reduce((acc: Resource, key: string) => {
                    if (additional.resource[key] !== undefined) acc[key] = clone(additional.resource[key]);
                    return acc;
                }, clonedTarget.resource);

        if (allowOverwriteRelationsOnMerge) {
            clonedTarget.resource.relations = clone(additional.resource.relations);
            if (clonedTarget.resource.relations && into.resource.relations) {
                clonedTarget.resource.relations['isRecordedIn'] = clone(into.resource.relations['isRecordedIn']);
            }
        }
        return clonedTarget;
    }
}