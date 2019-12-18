import {to, lookup, isObject, isnt, keys, isArray, keysAndValues} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {trimFields} from '../../util/trim-fields';
import {pairWith} from '../../../utils';
import {ImportErrors} from './import-errors';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function preprocessFields(documents: Array<Document>, permitDeletions: boolean) {

    documents.map(to('resource')).forEach(preprocessFieldsForResource(permitDeletions));
}


function preprocessFieldsForResource(permitDeletions: boolean) { return (resource: Resource) => {

    trimFields(resource);
    collapseEmptyProperties(resource, permitDeletions);
}}


function collapseEmptyProperties(struct: any|undefined, permitDeletions: boolean) {

    if (!struct) return;
    keysAndValues(struct)
        .forEach(([fieldName, fieldValue]: any) => {
            if (fieldName === 'relations') return;

            if (fieldValue === null) {
                if (!permitDeletions) delete struct[fieldName];
            } else if (typeof (fieldValue as any) === 'string' && fieldValue === '') {
                throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING];
            } else if (isObject(fieldValue) || isArray(fieldValue)) {
                collapseEmptyProperties(fieldValue, permitDeletions);

                if (!permitDeletions
                    && (Object.keys(fieldValue).length === 0
                        || Object.values(fieldValue).filter(isnt(null)).length === 0)) {

                    delete struct[fieldName];
                }
            }
        });
}

