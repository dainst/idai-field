import { describe, expect, test, beforeEach } from '@jest/globals';
import * as tsfun from 'tsfun';
import { Resource, Relation } from 'idai-field-core';
import { GEOMETRY, mergeResource, RELATIONS } from '../../../../../src/app/components/import/import/process/merge-resource';
import { ImportErrors } from '../../../../../src/app/components/import/import/import-errors';
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;


/**
 * @author Daniel de Oliveira
 */
describe('mergeResource', () => {

    const identifier = 'identifier1';

    const template: Resource = {
        id: 'id1',
        category: 'Object',
        identifier: identifier,
        shortDescription: 'shortDescription1',
        relations: { }
    };

    let target: Resource = {} as Resource;
    let source: Resource = {} as Resource;


    beforeEach(() => {

        target = tsfun.clone(template);
        target['anotherField'] = 'field1';
        source = tsfun.clone(template);
    });


    test('delete fields', () => {

        const source = {
            anotherField: null
        };

        const result = mergeResource(target, source as any);
        expect(result.shortDescription).toEqual('shortDescription1');
        expect(result.anotherField).toBeUndefined();
    });


    test('overwrite fields', () => {

        const source: Resource = {
            id: 'id1',
            category: 'Object',
            identifier: identifier,
            shortDescription: 'shortDescription2',
            anotherField: 'field2',
            relations: {}
        };

        const result = mergeResource(target, source);
        expect(result.shortDescription).toEqual('shortDescription2');
        expect(result.anotherField).toEqual('field2');
    });


    test('merge object field', () => {

        target['object'] = { aField: 'aOriginalValue', cField: 'cOriginalValue' };
        source['object'] = { aField: 'aChangedValue', bField: 'bNewValue' };

        const result = mergeResource(target, source);

        expect(result['object']['aField']).toEqual('aChangedValue');
        expect(result['object']['bField']).toEqual('bNewValue');
        expect(result['object']['cField']).toEqual('cOriginalValue');
    });


    test('merge object field - create target', () => {

        source['object'] = { aField: 'aNewValue' };

        const result = mergeResource(target, source);

        expect(result['object']['aField']).toEqual('aNewValue');
    });


    test('merge object field - delete item in target object', () => {

        target['object'] = { aField: 'aOriginalValue', bField: 'bOriginalValue' };
        source['object'] = { bField: null };

        const result = mergeResource(target, source);

        expect(result['object']['aField']).toBe('aOriginalValue');
        expect(result['object']['bField']).toBeUndefined();
    });


    test('merge object field - delete target object after deleting item in target object', () => {

        target['object'] = { aField: 'aOriginalValue' };
        source['object'] = { aField: null };

        const result = mergeResource(target, source);

        expect(result['object']).toBeUndefined();
    });


    test('merge object field - delete one field and add another', () => {

        target['object'] = { aField: 'aOriginalValue' };
        source['object'] = { aField: null, bField: 'bValue' };

        const result = mergeResource(target, source);

        expect(result['object']['aField']).toBeUndefined();
        expect(result['object']['bField']).toBe('bValue');
    });


    test('merge object field - delete object field', () => {

        target['object'] = { aField: 'aOriginalValue' };
        source['object'] = null;

        const result = mergeResource(target, source);

        expect(result['object']).toBeUndefined();
    });


    test('merge object field - create field - remove null', () => {

        target['object'] = undefined;
        source['object'] = { value: 1, endValue: null };

        const result = mergeResource(target, source);

        expect(result['object']['value']).toBe(1);
        expect(result['object']['endValue']).toBeUndefined();
    });


    test('merge object field - create field - create not if all null', () => {

        target['object'] = undefined;
        source['object'] = { value: null };

        const result = mergeResource(target, source);

        expect(result['object']).toBeUndefined();
    });


    test('merge objectArray field', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue', cField: 'cOriginalValue' }];
        source['objectArray'] = [{ aField: 'aChangedValue', bField: 'bNewValue' }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aChangedValue');
        expect(result['objectArray'][0]['bField']).toEqual('bNewValue');
        expect(result['objectArray'][0]['cField']).toEqual('cOriginalValue');
    });


    test('merge objectArray field - create target object', () => {

        target['objectArray'] = undefined;
        source['objectArray'] = [{ aField: 'aNewValue' }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aNewValue');
    });


    test('merge objectArray field - create target object - remove null', () => {

        target['objectArray'] = undefined;
        source['objectArray'] = [{ aField: 1, bField: null }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual(1);
        expect(result['objectArray'][0]['bField']).toBeUndefined();
    });


    test('merge objectArray field - create target object - create not if all null', () => {

        target['objectArray'] = undefined;
        source['objectArray'] = [{ aField: null }];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    test('merge objectArray field - delete target object', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }];
        source['objectArray'] = [{ aField: null }];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    test('merge objectArray field - delete target object with null entry', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }];
        source['objectArray'] = [null];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    test('merge objectArray field - delete target object (interpret emptied objects as null)', () => {

        target['objectArray'] = [{ aField: { aNested: 'aOriginalValue' } }];
        source['objectArray'] = [{ aField: { aNested: null } }];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    test('merge objectArray field - delete target object (interpret emptied objects as null) - case 2', () => {

        target['objectArray'] = [{ aField: { aNested: 'aOriginalValue' } }];
        source['objectArray'] = [{ aField: { aNested: null, bNested: null } }];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    test('merge objectArray field - do not copy a field containing only null values if target does not exist', () => {

        target['objectArray'] = [{ /* aField is undefined */ bField: 'bValue' }];
        source['objectArray'] = [{ aField: { aNested: null } }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['bField']).toEqual('bValue');
        expect(result['objectArray'][0]['aField']).toBeUndefined();
    });


    test('merge objectArray field - create a nested object if target does not exist', () => {

        target['objectArray'] = [{ /* aField is undefined */ bField: 'bValue'}];
        source['objectArray'] = [{ aField: { aNested: 'aNestedValue' } }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['bField']).toEqual('bValue');
        expect(result['objectArray'][0]['aField']['aNested']).toEqual('aNestedValue');
    });


    test('merge objectArray field - leave nested fields as is, if not deleted by null', () => {

        target['objectArray'] = [{ aField: { aNested: 'aNestedOriginalValue' } }];
        source['objectArray'] = [{ aField: { bNested: null } }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']['aNested']).toEqual('aNestedOriginalValue');
        expect(result['objectArray'][0]['aField']['bNested']).toBeUndefined();
    });


    test('merge objectArray field - delete target object (interpret deeply nested, emptied objects as null)', () => {

        target['objectArray'] = [{ aField: { aNested: { aDeeplyNested: 'aOriginalValue' } } }];
        source['objectArray'] = [{ aField: { aNested: { aDeeplyNested: null } } }];

        const result = mergeResource(target, source);
        expect(result['objectArray']).toBeUndefined();
    });


    test('merge objectArray field - delete one target object', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' },{ bField: 'bOriginalValue' }];
        source['objectArray'] = [undefined, { bField: null }];

        const result = mergeResource(target, source);

        expect(result['objectArray'].length).toBe(1);
        expect(result['objectArray'][0]['aField']).toBe('aOriginalValue');
    });


    test('merge objectArray field - target object to delete is not defined', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }];
        source['objectArray'] = [undefined, { bField: null }];

        const result = mergeResource(target, source);

        expect(result['objectArray'].length).toBe(1);
        expect(result['objectArray'][0]['aField']).toBe('aOriginalValue');
    });


    test('merge objectArray field - target object to delete is not defined - 2 undefined', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }];
        source['objectArray'] = [undefined, undefined ,{ bField: null }];

        const result = mergeResource(target, source);

        expect(result['objectArray'].length).toBe(1);
        expect(result['objectArray'][0]['aField']).toBe('aOriginalValue');
    });


    test('merge objectArray field - change one target object and add one target object', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }];
        source['objectArray'] = [{ aField: 'aChangedValue' }, { bField: 'bNewValue' }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aChangedValue');
        expect(result['objectArray'][1]['bField']).toEqual('bNewValue');
    });


    test('merge objectArray field - ignore undefined-valued field', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }, { bField: 'bOriginalValue' }];
        source['objectArray'] = [undefined, { bField: 'bChangedValue' }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result['objectArray'][1]['bField']).toEqual('bChangedValue');
    });


    test('merge objectArray field - ignore undefined-valued field, add array object', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }];
        source['objectArray'] = [ undefined, { bField: 'bNewValue' }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result['objectArray'][1]['bField']).toEqual('bNewValue');
    });


    test('merge objectArray field - ignore undefined-valued field, add two array objects', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue' }];
        source['objectArray'] = [undefined, { bField: 'bNewValue' }, { cField: 'cNewValue' }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result['objectArray'][1]['bField']).toEqual('bNewValue');
        expect(result['objectArray'][2]['cField']).toEqual('cNewValue');
    });


    test('merge objectArray field - create target objectArray', () => {

        source['objectArray'] = [{aField: 'aNewValue'}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aNewValue');
    });


    test('dont overwrite identifier, id', () => {

        const source: Resource = {
            id: 'id2',
            category: 'Object',
            identifier: 'identifier2',
            shortDescription: 'shortDescription2',
            anotherField: 'field2',
            relations: {}
        };

        const result = mergeResource(target, source);
        expect(result.identifier).toEqual('identifier1');
        expect(result.id).toEqual('id1');
        expect(result.category).toEqual('Object');
        expect(result.relations).toEqual({});
    });


    test('merge array fields', () => {

        target['array'] = [1, 2, 7];
        // we choose to make it shorter than the target array for the test
        // to ensure the object array rule does not apply, which would make the result [3,4,7]
        source['array'] = [3, 4];

        const result = mergeResource(target, source);
        expect(result['array']).toEqual([3, 4]);
    });


    test('overwrite, do not merge geometry', () => {

        target[GEOMETRY] = { a: 1 };
        source[GEOMETRY] = { b: 2 };

        const result = mergeResource(target, source);
        expect(result[GEOMETRY]['b']).toEqual(2);
        expect(result[GEOMETRY]['a']).toBeUndefined();
    });


    test('merge relations', () => {

        target[RELATIONS] = { a: ['a1', 'a2'] };
        source[RELATIONS] = {
            a: ['a3'], // fewer entries than original, to make sure arrayObject rule is not applied
            b: ['b1'] };

        const result = mergeResource(target, source);
        expect(result[RELATIONS]['a']).toEqual(['a3']);
        expect(result[RELATIONS]['b']).toEqual(['b1']);
    });


    test('merge relations, do not overwrite RECORDED_IN', () => {

        target[RELATIONS][RECORDED_IN] = ['a', 'b'];
        source[RELATIONS][RECORDED_IN] = ['c'];

        const result = mergeResource(target, source);
        expect(result[RELATIONS][RECORDED_IN]).toEqual(['a', 'b']);
    });


    test('null or undefined values in object arrays are not considered as array of heterogeneous types', () => {

        const o = { a: 1 };

        source['array'] = [o, null, null];
        mergeResource(target, source);

        source['array'] = [o, undefined, null];
        mergeResource(target, source);


        try {
            source['array'] = [undefined, o];
            mergeResource(target, source);
        } catch (expected) {
            if (expected[0] === ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES) throw new Error('Test failure');
        }

        try {
            source['array'] = [null, o];
            mergeResource(target, source);
        } catch (expected) {
            if (expected[0] === ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES) throw new Error('Test failure');
        }

        try {
            source['array'] = [null, o, undefined, o];
            mergeResource(target, source);
        } catch (expected) {
            if (expected[0] === ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES) throw new Error('Test failure');
        }
    });


    // err cases

    test('array of heterogeneous categories - top level', () => {

        source['array'] = [{ a: 1 }, 2];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]);
        }
    });


    test('array of heterogeneous categories - nested', () => {

        source['array'] = { b: [{ a: 1 }, 2] };

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]);
        }
    });


    test('array of heterogeneous categories - non-object array must not contain undefined', () => {

        source['array'] = [2, undefined];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]);
        }

        source['array'] = [undefined, 2];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]);
        }
    });


    test('array of heterogeneous categories - non-object array cannot contain null', () => {

        source['array'] = [2, null];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]);
        }

        source['array'] = [null, 2];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES, identifier]);
        }
    });


    test('attempted to change category', () => {

        const source: Resource = {
            id: 'id2',
            category: 'Object2',
            identifier: identifier,
            shortDescription: 'shortDescription2',
            anotherField: 'field2',
            relations: {}
        };

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.CATEGORY_CANNOT_BE_CHANGED, identifier]);
        }
    });


    test('merge objectArray field - target object to delete is not defined - do not allow empty entries', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [undefined, undefined ,{bField: 'bNewValue'}];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]);
        }
    });

    test('merge objectArray field - throw if the deletion would occur but there are still objects to the right side', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}, {bField: 'bOriginalValue'}];
        source['objectArray'] = [{aField: null}];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]);
        }
    });


    test('merge objectArray field - ignore null-valued field, do not add array object, if this would result in empty entries', () => {

        target['objectArray'] = undefined;
        source['objectArray'] = [null, {bField: 'bNewValue'}];

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]);
        }
    });


    test('violate precondition in target', () => {

        target['anotherField'] = { a: {} };

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual('Precondition violated in mergeResource. Identifier: identifier1');
        }
    });


    test('violate precondition in source', () => {

        source['anotherField'] = { a: {} };

        try {
            mergeResource(target, source);
            throw new Error('Test failure');
        } catch (expected) {
            expect(expected).toEqual('Precondition violated in mergeResource. Identifier: identifier1');
        }
    });
});
