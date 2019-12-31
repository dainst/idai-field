import {dropRightWhile, includedIn, is, isArray, isNot, isObject, keys, isEmpty, values, isnt, flow, dissoc} from 'tsfun';
import {NewResource, Resource} from 'idai-components-2';
import {clone} from '../../../util/object-util';
import {HIERARCHICAL_RELATIONS} from '../../../model/relation-constants';
import {ImportErrors} from '../import-errors';
import {hasEmptyAssociatives} from './has-empty-associatives';
import {cond} from 'tsfun-core/src/composition';


/**
 * @author Daniel de Oliveira
 *
 * @throws
 *   [ImportErrors.TYPE_CANNOT_BE_CHANGED] TODO document in process apidoc
 *   [ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN] // TODO improve actual displayed message
 *     - if a new array object is to be created at an index which would leave unfilled indices between
 *       the new index and the last index of the array which is filled in the original field.
 *     - if the deletion of an array object will leave it empty
 */
export function mergeResource(into: Resource, additional: NewResource): Resource {

    assertNoEmptyAssociatives(into); // our general assumption regarding documents stored in the database
    assertNoEmptyAssociatives(additional); // our assumption regarding the import process; TODO document precondition in apidoc

    if (additional.type && into.type !== additional.type) {
        throw [ImportErrors.TYPE_CANNOT_BE_CHANGED, into.identifier];
    }

    let target: Resource = clone(into);

    try {

        target =
            overwriteOrDeleteProperties(
                target,
                additional,
                Resource.CONSTANT_FIELDS, true);

        if (!additional.relations) return target;

        target.relations =
            overwriteOrDeleteProperties(
                target.relations ? target.relations : {},
                additional.relations,
                [HIERARCHICAL_RELATIONS.RECORDED_IN],
                false);
        return target;

    } catch (err) {
        throw err === ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN
            ? [ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, into.identifier]
            : err;
    }
}


function assertNoEmptyAssociatives(resource: Resource|NewResource) {

    flow(resource,
        dissoc('geometry'),
        dissoc('relations'),
        cond(hasEmptyAssociatives, () => {
            throw Error('Precondition violated in mergeResource. Identifier: ' + resource.identifier);
        }));
}


/**
 * Iterates over all fields of source, except those specified by exlusions
 * and either copies them from source to target
 * or deletes them if the field is set to null.
 *
 * If expandObjectArrays is set, objects contained within array fields
 * get copied by the same rules, recursively.
 *
 * @param target
 * @param source
 * @param exclusions
 * @param expandObjectArrays
 */
function overwriteOrDeleteProperties(target: {[_: string]: any}|undefined,
                                     source: {[_: string]: any},
                                     exclusions: string[],
                                     expandObjectArrays: boolean) {

    return Object.keys(source)
        .filter(isNot(includedIn(exclusions)))
        .reduce((target: any, propertyName: string|number) => {

            if (source[propertyName] === null) delete target[propertyName];
            else if (expandObjectArrays && isArray(source[propertyName])) {

                if (!target[propertyName]) target[propertyName] = [];
                target[propertyName] = expandObjectArray(target[propertyName], source[propertyName]);
                if (target[propertyName].length === 0) delete target[propertyName];
            }
            else if (isObject(source[propertyName])) { // TODO review conditions

                if (isEmpty(source[propertyName])) {

                    delete target[propertyName];
                    return target;
                }

                if (isObject(target[propertyName])) {
                    overwriteOrDeleteProperties(target[propertyName], source[propertyName], [], expandObjectArrays);
                } else {
                    target[propertyName] = source[propertyName];
                }

                if (isEmpty(target[propertyName]) ||
                    values(target[propertyName]).filter(isnt(null)).length === 0) {

                    delete target[propertyName];
                }
            }
            else target[propertyName] = source[propertyName];

            return target;
        }, target ? target : {});
}


function expandObjectArray(target: Array<any>, source: Array<any>) {

    keys(source).forEach(index => {

        if (source[index] === undefined || source[index] === null) return; // TODO should ignore only undefined, but not null

        if (target.length < index) throw ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN;

        if (isObject(source[index]) && isObject(target[index])) {
            overwriteOrDeleteProperties(target[index], source[index], [], true);
        } else {
            target[index] = source[index];
        }

        if (keys(target[index]).length === 0) target[index] = null;
    });

    const result = dropRightWhile(is(null))(target);
    if (result.includes(null)) throw ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN;
    return result;
}