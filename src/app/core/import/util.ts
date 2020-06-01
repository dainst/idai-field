import {Associative, is, isArray, isEmpty, isObject} from 'tsfun';


/**
 * @param struct
 * @author Daniel de Oliveira
 */
export function hasEmptyAssociatives(struct: Associative<any>): boolean {

    if (!isArray(struct) && !isObject(struct)) return false;
    if (isEmpty(struct)) return true;
    return Object.values(struct)
        .map(hasEmptyAssociatives)
        .some(is(true));
}
