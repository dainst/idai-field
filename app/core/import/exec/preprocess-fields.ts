import {to, isNot, includedIn, lookup, isObject, isnt, keys, isArray} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {trimFields} from '../../util/trim-fields';
import {pairWith} from '../../../utils';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function preprocessFields(documents: Array<Document>, permitDeletions: boolean) {

    documents.map(to('resource')).forEach(preprocessFieldsForResource(permitDeletions));
}


function preprocessFieldsForResource(permitDeletions: boolean) { return (resource: Resource) => {

    trimFields(resource);
    mapEmptyPropertiesToNull(resource, Resource.CONSTANT_FIELDS, permitDeletions);
    mapEmptyPropertiesToNull(resource.relations, [], permitDeletions);
}}


function mapEmptyPropertiesToNull(struct: any|undefined, exclusions: string[], permitDeletions: boolean) {

    if (!struct) return;
    keys(struct)
        .filter(isNot(includedIn(exclusions as any)))
        .map(pairWith(lookup(struct)))
        .forEach(([fieldName, fieldValue]: any) => {

            if (typeof fieldValue === 'string' && fieldValue === '') {
                if (permitDeletions) struct[fieldName] = null;
                else delete struct[fieldName];
            } else if (isObject(fieldValue) || isArray(fieldValue)) {
                mapEmptyPropertiesToNull(fieldValue, [], permitDeletions);
                if (!permitDeletions && Object.keys(fieldValue).length === 0) delete struct[fieldName];
                if (permitDeletions && Object.values(fieldValue).filter(isnt(null)).length === 0) struct[fieldName] = null;
            }
        });
}

