import {defined, dropRightWhile, isArray, isEmpty, isNot, keysAndValues, copy, ObjectCollection} from 'tsfun';
import {isArrayIndex, isAssociative, isEmptyString} from '../util';
import {ImportErrors} from './import-errors';


/**
 * @param struct
 *
 * @author Daniel de Oliveira
 */
export function collapseEmptyProperties(struct: ObjectCollection<any>): ObjectCollection<any>;
export function collapseEmptyProperties(struct: Array<any>): Array<any>
export function collapseEmptyProperties(struct: ObjectCollection<any>|Array<any>): ObjectCollection<any>|Array<any> {

    const struct_ = copy(struct) as any;

    keysAndValues(struct_).forEach(([fieldName, fieldValue]: any) => {

        if (fieldValue === undefined) throw Error("unexpected 'undefined' value found in preprocessFields");
        if (isEmptyString(fieldValue)) throw [ImportErrors.MUST_NOT_BE_EMPTY_STRING]; // TODO this should have been done earlier

        function undefineField() {

            if (isArrayIndex(fieldName)) struct_[fieldName] = undefined;
            else delete struct_[fieldName];
        }

        if (fieldValue === null) {

            undefineField();

        } else if (isAssociative(fieldValue)) {

            struct_[fieldName] = collapseEmptyProperties(fieldValue);
            if (isEmpty(struct_[fieldName])) undefineField();
        }
    });

    if (isArray(struct_)) return dropRightWhile(isNot(defined))(struct_);
    return struct_;
}