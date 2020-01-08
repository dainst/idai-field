import {values, isEmpty, is, isArray, isObject} from 'tsfun';


/**
 * TODO move to util
 *
 * @param struct
 * @author Daniel de Oliveira
 */
export function hasEmptyAssociatives(struct: any): boolean {

    if (!isArray(struct) && !isObject(struct)) return false;
    if (isEmpty(struct)) return true;
    return values(struct)
        .map(hasEmptyAssociatives)
        .some(is(true));
}