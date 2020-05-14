import {Associative, is, isArray, isEmpty, isObject, values} from 'tsfun';


/**
 * @param struct
 * @author Daniel de Oliveira
 */
export function hasEmptyAssociatives(struct: Associative<any>): boolean {

    if (!isArray(struct) && !isObject(struct)) return false;
    if (isEmpty(struct)) return true;
    return values(struct)
        .map(hasEmptyAssociatives)
        .some(is(true));
}