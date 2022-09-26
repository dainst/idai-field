import { isDefined, dropRightWhile, isArray, isEmpty, isAssociative, copy, Map, isObject,
    and, isString, keysValues, not } from 'tsfun';
import { ImportErrors } from './import-errors';


/**
 * @param struct must not be empty, nor must it contain any empty collection at nested levels
 *
 * @author Daniel de Oliveira
 */
export function removeNullProperties(struct: Map<any>): Map<any>|undefined;
export function removeNullProperties(struct: Array<any>): Array<any>|undefined;
export function removeNullProperties(struct: Map<any>|Array<any>): Map<any>|Array<any>|undefined {

    if (isEmpty(struct)) throw [ImportErrors.EMPTY_OBJECT_IN_RESOURCE];
    let struct_ = copy(struct) as any;

    keysValues(struct_).forEach(([fieldName, originalFieldValue]) => {

        if (isObject(struct) && originalFieldValue === undefined) throw 'unexpected \'undefined\' value found in object parameter in removeNullProperties()';
        if (and(isString, isEmpty)(originalFieldValue)) throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING];

        if (isAssociative(originalFieldValue)) {
            struct_[fieldName] = removeNullProperties(originalFieldValue);
        }

        if (originalFieldValue === null || struct_[fieldName] === undefined) {
            if (isArray(struct_)) struct_[fieldName] = undefined;
            else delete struct_[fieldName];
        }
    });

    if (isArray(struct_)) struct_ = dropRightWhile(not(isDefined))(struct_);
    return isEmpty(struct_)
        ? undefined
        : struct_;
}
