import {Document, Resource} from 'idai-components-2';
import {clone} from '../../util/object-util';
import {isNot, includedIn} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module DocumentMerge {

    const PROTECTED_FIELDS = ['id', 'identifier', 'relations'];


    export function merge(target: Document, source: Document): Document {

        const clonedTarget = clone(target);

        clonedTarget.resource =
            Object.keys(source.resource)
                .filter(isNot(includedIn(PROTECTED_FIELDS)))
                .reduce((acc: Resource, key: string) => {
                    if (source.resource[key] !== undefined) acc[key] = source.resource[key];
                    return acc;
                }, clonedTarget.resource);

        return clonedTarget;
    }
}