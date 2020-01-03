import {isArray, isnt, isObject, keysAndValues} from 'tsfun';
import {Resource} from 'idai-components-2';
import {trimFields} from '../../util/trim-fields';
import {ImportErrors} from './import-errors';
import {isNumber} from '../util';


/**
 * @param resources modified in place
 * @param permitDeletions
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function preprocessFields(resources: Array<Resource>, permitDeletions: boolean): void {

    resources.forEach(preprocessFieldsForResource(permitDeletions));
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
                if (!permitDeletions) {
                    if (isNumber(fieldName) /* array index */) struct[fieldName] = undefined;
                    else delete struct[fieldName];
                }
            } else if (typeof (fieldValue as any) === 'string' && fieldValue === '') {
                throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING];
            } else if (isObject(fieldValue) || isArray(fieldValue)) {
                collapseEmptyProperties(fieldValue, permitDeletions);

                if (!permitDeletions) {

                    if (Object.keys(fieldValue).length === 0
                           || Object.values(fieldValue).filter(isnt(null)).length === 0) {

                        if (isNumber(fieldName)) struct[fieldName] = undefined;
                        else delete struct[fieldName];
                    }
                }
            }
        });
}

