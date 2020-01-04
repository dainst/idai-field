import {defined, dropRightWhile, isArray, isEmpty, isNot, keysAndValues, copy, ObjectCollection} from 'tsfun';
import {isAssociative, isEmptyString} from '../util';
import {ImportErrors} from './import-errors';


/**
 * @param struct
 *
 * @author Daniel de Oliveira
 */
export function collapseEmptyProperties(struct: ObjectCollection<any>): ObjectCollection<any>|undefined;
export function collapseEmptyProperties(struct: Array<any>): Array<any>|undefined;
export function collapseEmptyProperties(struct: ObjectCollection<any>|Array<any>): ObjectCollection<any>|Array<any>|undefined {

    let struct_ = copy(struct) as any;

    keysAndValues(struct_).forEach(([fieldName, originalFieldValue]: any) => {

        if (originalFieldValue === undefined) throw Error("unexpected 'undefined' value found in preprocessFields");
        if (isEmptyString(originalFieldValue)) throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING]; // TODO this should have been done earlier

        if (isAssociative(originalFieldValue)) {

            struct_[fieldName] = collapseEmptyProperties(originalFieldValue);
        }

        if (originalFieldValue === null || struct_[fieldName] === undefined) {

            if (isArray(struct_)) struct_[fieldName] = undefined;
            else delete struct_[fieldName];
        }
    });

    if (isArray(struct_)) struct_ = dropRightWhile(isNot(defined))(struct_);
    return isEmpty(struct_)
        ? undefined
        : struct_;
}