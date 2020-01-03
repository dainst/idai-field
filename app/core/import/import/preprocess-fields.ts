import {defined, dropRightWhile, isArray, isDefined, isNot, isObject, keys, keysAndValues} from 'tsfun';
import {Resource} from 'idai-components-2';
import {trimFields} from '../../util/trim-fields';
import {ImportErrors} from './import-errors';
import {isArrayIndex, isEmptyString} from '../util';


/**
 * Trims leading and trailing empty characters.
 * Converts nulls to undefined values.
 *
 * @param resources modified in place
 * @param permitDeletions if set to false, all nulls get converted to undefined values.
 *   Nested associative structures will be collapsed.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function preprocessFields(resources: Array<Resource>, permitDeletions: boolean): void {

    resources.forEach(preprocessFieldsForResource(!permitDeletions));
}


function preprocessFieldsForResource(convertNulls: boolean) { return (resource: Resource) => {

    trimFields(resource);
    if (convertNulls) collapseEmptyProperties(resource);
}}


function collapseEmptyProperties(struct: any|undefined) {

    if (!struct) return;
    keysAndValues(struct)
        .forEach(([fieldName, fieldValue]: any) => {
            if (fieldName === 'relations') return;
            if (fieldValue === undefined) throw Error("unexpected 'undefined' value found in preprocessFields");
            if (isEmptyString(fieldValue)) throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING];

            if (fieldValue === null) {

                if (isArrayIndex(fieldName)) struct[fieldName] = undefined;
                else delete struct[fieldName];

            } else if (isObject(fieldValue) || isArray(fieldValue)) {
                collapseEmptyProperties(fieldValue);

                let fv = fieldValue;
                if (isArray(fieldValue)) {
                    fv = dropRightWhile(isNot(defined))(fieldValue);
                    struct[fieldName] = fv;
                }

                if (keys(fv).length === 0 || keys(fv).filter(isDefined).length === 0) {

                    if (isArrayIndex(fieldName)) struct[fieldName] = undefined;
                    else delete struct[fieldName];
                }
            }
        });
}

