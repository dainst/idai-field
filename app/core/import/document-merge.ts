import {Document, Resource} from 'idai-components-2';
import {clone} from '../../util/object-util';
import {differentFrom} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module DocumentMerge {

    export function merge(target: Document, source: Document): Document {

        const clonedTarget = clone(target);

        clonedTarget.resource =
            Object.keys(source.resource)
                .filter(differentFrom('relations'))
                .filter(differentFrom('id'))
                .filter(differentFrom('identifier'))
                .reduce((acc: Resource, key: string) => {
                    if (source.resource[key] !== undefined) {
                        acc[key] = source.resource[key];
                    }
                    return acc;
                }, clonedTarget.resource);

        return clonedTarget;
    }
}