import {to, isNot, includedIn, lookup} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {trimFields} from '../../util/trim-fields';
import {pairWith} from '../../../utils';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function preprocessFields(documents: Array<Document>) {

    documents.map(to('resource')).forEach(preprocessFieldsForResource);
}


function preprocessFieldsForResource(resource: Resource) {

    trimFields(resource);
    mapEmptyPropertiesToNull(resource, Resource.CONSTANT_FIELDS);
    mapEmptyPropertiesToNull(resource.relations, []);
}


function mapEmptyPropertiesToNull(resource: any|undefined, exclusions: string[]) {

    if (!resource) return;
    Object.keys(resource)
        .filter(isNot(includedIn(exclusions)))
        .map(pairWith(lookup(resource)))
        .forEach((fieldName: any, fieldValue: any) => {
            if (typeof fieldValue === 'string' && fieldValue === '') {
                resource[fieldName] = null;
            }
        });
}

