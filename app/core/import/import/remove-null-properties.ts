import {defined, dropRightWhile, isArray, isEmpty, isAssociative,
    isNot, keysAndValues, copy, ObjectCollection, isObject} from 'tsfun';
import {isEmptyString} from '../util';
import {ImportErrors} from './import-errors';


/**
 * @param struct must not be empty, nor must it contain any empty collection at nested levels
 *
 * @author Daniel de Oliveira
 */
export function removeNullProperties(struct: ObjectCollection<any>): ObjectCollection<any>|undefined;
export function removeNullProperties(struct: Array<any>): Array<any>|undefined;
export function removeNullProperties(struct: ObjectCollection<any>|Array<any>): ObjectCollection<any>|Array<any>|undefined {

    if (isEmpty(struct)) throw Error("illegal parameter. empty collection given to removeNullProperties");
    let struct_ = copy(struct) as any;

    keysAndValues(struct_).forEach(([fieldName, originalFieldValue]: any) => {

        if (isObject(struct) && originalFieldValue === undefined) throw Error("unexpected 'undefined' value found in object parameter in removeNullProperties()");
        if (isEmptyString(originalFieldValue)) throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING]; // TODO this should have been done earlier

        if (isAssociative(originalFieldValue)) {
            struct_[fieldName] = removeNullProperties(originalFieldValue);
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