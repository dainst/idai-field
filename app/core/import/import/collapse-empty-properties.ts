import {defined, dropRightWhile, isArray, isDefined, isNot, isObject, keys, keysAndValues} from 'tsfun';
import {isArrayIndex, isAssociative, isEmptyString} from '../util';
import {ImportErrors} from './import-errors';


/**
 * @param struct
 *
 * @author Daniel de Oliveira
 */
export function collapseEmptyProperties(struct: any|undefined) {

    if (!struct) return; // TODO review
    keysAndValues(struct).forEach(([fieldName, fieldValue]: any) => {

        if (fieldValue === undefined) throw Error("unexpected 'undefined' value found in preprocessFields");
        if (isEmptyString(fieldValue)) throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING]; // TODO this should have been done earlier

        if (fieldValue === null) {

            if (isArrayIndex(fieldName)) struct[fieldName] = undefined;
            else delete struct[fieldName];

        } else if (isAssociative(fieldValue)) {

            let fv = collapseEmptyProperties(fieldValue); // TODO review

            if (isArray(fv)) {
                fv = dropRightWhile(isNot(defined))(fv);
                struct[fieldName] = fv;
            }

            if (keys(fv).length === 0 || keys(fv).filter(isDefined).length === 0) {

                if (isArrayIndex(fieldName)) struct[fieldName] = undefined;
                else delete struct[fieldName];
            }
        }
    });

    return struct; // TODO review
}