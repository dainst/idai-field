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
    collapseEmptyProperties(resource, Resource.CONSTANT_FIELDS, permitDeletions);
    collapseEmptyProperties(resource.relations, [], permitDeletions);
}}


function collapseEmptyProperties(struct: any|undefined, exclusions: string[], permitDeletions: boolean) {

    if (!struct) return;
    keys(struct)
        .filter(isNot(includedIn(exclusions as any)))
        .map(pairWith(lookup(struct)))
        .forEach(([fieldName, fieldValue]: any) => {

            if (fieldValue === null) {

                if (!permitDeletions) delete struct[fieldName];

            } else if (typeof fieldValue === 'string' && fieldValue === '') {

                // TODO improve
                throw ["FIELD VALUE MUST NOT BE EMPTY ARRAY"]

            } else if (isObject(fieldValue) || isArray(fieldValue)) {
                collapseEmptyProperties(fieldValue, [], permitDeletions);
                if (Object.keys(fieldValue).length === 0) {
                    if (permitDeletions) struct[fieldName] = null; // TODO remove duplication
                    else delete struct[fieldName];
                }
                if (Object.values(fieldValue).filter(isnt(null)).length === 0) {
                    if (permitDeletions) struct[fieldName] = null;
                    else delete struct[fieldName];
                }
            }
        });
}

