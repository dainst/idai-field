import { Associative, cond, detach, dropRightWhile, filter, flow, forEach, includedIn, is, isArray,
    isAssociative, isEmpty, isNot, isnt, isObject, Map, update, values, clone } from 'tsfun';
import { Relation, typeOf, NewResource, Resource, EditableValue } from 'idai-field-core';
import { hasEmptyAssociatives } from '../../util';
import { ImportErrors } from '../import-errors';


export const GEOMETRY = 'geometry';
export const RELATIONS = 'relations';


/**
 * @author Daniel de Oliveira
 *
 * @param into
 * @param additional Must not contain empty objects or arrays as any leaf of the tree.
 *
 * @throws
 *   [ImportErrors.CATEGORY_CANNOT_BE_CHANGED, identifier]
 *   [ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]
 *     - if a new array object is to be created at an index which would leave unfilled indices between
 *       the new index and the last index of the array which is filled in the original field.
 *     - if the deletion of an array object will leave it empty
 *   [ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]
 */
export function mergeResource(into: Resource, additional: NewResource): Resource {

    assertRelationsSet(into);
    assertNoEmptyAssociatives(into);       // our general assumption regarding documents stored in the database
    assertNoEmptyAssociatives(additional); // our assumption regarding the import process;

    try {
        assertArraysHomogeneouslyTyped(additional);
        assertNoAttemptToChangeCategory(into, additional);

        const target = overwriteOrDeleteProperties(
            clone(into),
            additional,
            Resource.CONSTANT_FIELDS.concat([GEOMETRY])
        );

        if (additional[GEOMETRY]) target[GEOMETRY] = additional[GEOMETRY];

        return !additional.relations
            ? target
            : update(
                RELATIONS,
                overwriteOrDeleteProperties(
                    target.relations,
                    additional.relations,
                    [Relation.Hierarchy.RECORDEDIN]))
            (target) as Resource;
    } catch (err) {
        throw appendIdentifier(err, into.identifier);
    }
}


function appendIdentifier(err: any, identifier: string) {

    return isArray(err) ? err.concat(identifier) : err;
}


const assertArrayHomogeneouslyTyped =
    as => as.reduce((arrayItemsType: string|undefined, arrayItem) => {
        // typeof null -> 'object', typeof undefined -> 'undefined'
        const t = typeof arrayItem === 'undefined' ? 'object' : typeof arrayItem;

        if (arrayItemsType !== undefined && t !== arrayItemsType) throw [ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES];
        return t;
    }, undefined);


/**
 * heterogeneous arrays like
 * [1, {b: 2}]
 * are not allowed
 *
 * exceptions are undefined values
 * [undefined, 2, null, 3]
 * undefined and null values get ignored
 */
function assertArraysHomogeneouslyTyped(o: Associative<any>) {

    flow(o,
        values,
        forEach(cond(isArray, assertArrayHomogeneouslyTyped)),
        forEach(cond(isAssociative, assertArraysHomogeneouslyTyped))
    );
}


function assertRelationsSet(into: Resource) {

    if (!into.relations) throw 'illegal argument in mergeResource: relations not defined for \'into\'';
}


function assertNoAttemptToChangeCategory(into: Resource, additional: NewResource) {

    if (additional.category && into.category !== additional.category) {
        throw [ImportErrors.CATEGORY_CANNOT_BE_CHANGED];
    }
}


function assertNoEmptyAssociatives(resource: Resource|NewResource) {

    flow(resource,
        detach(GEOMETRY),
        detach(RELATIONS),
        cond(hasEmptyAssociatives, () => {
            throw 'Precondition violated in mergeResource. Identifier: ' + resource.identifier;
        })
    );
}


function isObjectArray(fieldContent: any[]|any): boolean {

    if (!isArray(fieldContent)) return false;

    const arrayType = fieldContent
        .map(typeOf)
        // typeof null -> 'object', typeof undefined -> 'undefined'
        .map(cond(is('undefined'), 'object'))
        // By assertion we know our arrays are not empty and all entries are of one type
        [0];

    return arrayType === 'object';
}


function isEditableValueArray(target: Resource, fieldName: string): boolean {

    return target.category === 'Project' && (fieldName === 'staff' || fieldName == 'campaigns');
}


/**
 * Iterates over all fields of source, except those specified by exclusions
 * and either copies them from source to target
 * or deletes them if the field is set to null.
 *
 * If expandObjectArrays is set, objects contained within array fields
 * get copied by the same rules, recursively.
 *
 * @param target
 * @param source
 * @param exclusions
 */
function overwriteOrDeleteProperties(target: Map<any>|undefined, source: Map<any>, exclusions: string[]) {

    return Object.keys(source)
        .filter(isNot(includedIn(exclusions)))
        .reduce((target: any, property: string|number) => {
            if (source[property] === null) {
                delete target[property];
            } else if (isEditableValueArray(target, property as string)) {
                target[property] = mergeEditableValues(source[property], target[property]);
            } else if (isObjectArray(source[property])) {
                if (!target[property]) target[property] = [];
                target[property] = expandObjectArray(target[property], source[property]);
                if (target[property].length === 0) delete target[property];
            } else if (isObject(source[property]) && isObject(target[property])) {
                overwriteOrDeleteProperties(target[property], source[property], []);
                if (isEmpty(target[property])) delete target[property];
            } else if (isObject(source[property]) && target[property] === undefined) {
                if (Object.values(source[property]).filter(isnt(null)).length > 0) {
                    target[property] = filter(source[property], isnt(null));
                }
            } else {
                target[property] = source[property];
            }

            return target;
        }, target ? target : {});
}


function expandObjectArray(target: Array<any>, source: Array<any>) {

    Object.keys(source).forEach(index => {
        // This can happen if deletions are not permitted and
        // null values got collapsed via preprocessFields
        if (source[index] === undefined) {
            // make the slot so array will not be sparse
            if (target[index] === undefined) target[index] = null;
            return;
        } else if (source[index] === null) {
            target[index] = null;
            return;
        }

        if (target[index] === undefined && isObject(source[index])) target[index] = {};

        if (isObject(source[index]) && isObject(target[index])) {
            overwriteOrDeleteProperties(target[index], source[index], []);
        } else {
            target[index] = source[index];
        }

        if (isObject(target[index]) && Object.keys(target[index]).length === 0) target[index] = null;
    });

    const result = dropRightWhile(is(null))(target);
    if (result.includes(null)) throw [ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN];
    return result;
}


function mergeEditableValues(source: string[], target: Array<EditableValue>): Array<EditableValue> {

    if (!target) target = [];

    return source.map(value => {
        const existingElement: EditableValue = target.find(element => element.value === value);
        return {
            value,
            selectable: !existingElement || existingElement.selectable
        };
    });
}
