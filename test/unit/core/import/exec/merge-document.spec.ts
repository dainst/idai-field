import {Document} from 'idai-components-2';
import {mergeDocument} from '../../../../../app/core/import/exec/process/merge-document';
import {ImportErrors} from '../../../../../app/core/import/exec/import-errors';
import {clone} from '../../../../../app/core/util/object-util';


/**
 * @author Daniel de Oliveira
 */
describe('mergeDocument', () => {

    const template: Document = {
        _id: 'id1',
        modified: [],
        created: undefined,
        resource: {
            id: 'id1',
            type: 'Object',
            identifier: 'identifier1',
            shortDescription: 'shortDescription1',
            relations: { }
        }
    };

    let target: Document = {} as Document;
    let source: Document = {} as Document;


    beforeEach(() => {

        target = clone(template);
        target['anotherField'] = 'field1';
        source = clone(template);
    });


    it('delete fields', () => {

        const source = {
            modified: [],
            created: undefined,
            resource: { anotherField: null,}
        };

        const result = mergeDocument(target, source as any);
        expect(result.resource.shortDescription).toEqual('shortDescription1');
        expect(result.resource.anotherField).toBeUndefined();
    });


    it('overwrite fields', () => {

        const source = {
            _id: 'id1',
            modified: [],
            created: undefined,
            resource: {
                id: 'id1',
                type: 'Object',
                identifier: 'identifier1',
                shortDescription: 'shortDescription2',
                anotherField: 'field2',
                relations: {}
            }
        };

        const result = mergeDocument(target, source);
        expect(result.resource.shortDescription).toEqual('shortDescription2');
        expect(result.resource.anotherField).toEqual('field2');
    });

    
    it('merge object field', () => {

        target.resource['object'] = {aField: 'aOriginalValue', cField: 'cOriginalValue'};
        source.resource['object'] = {aField: 'aChangedValue', bField: 'bNewValue'};

        const result = mergeDocument(target, source);

        expect(result.resource['object']['aField']).toEqual('aChangedValue');
        expect(result.resource['object']['bField']).toEqual('bNewValue');
        expect(result.resource['object']['cField']).toEqual('cOriginalValue');
    });


    it('merge object field - create target', () => {

        source.resource['object'] = {aField: 'aNewValue'};

        const result = mergeDocument(target, source);

        expect(result.resource['object']['aField']).toEqual('aNewValue');
    });


    it('merge objectArray field', () => {

        target.resource['objectArray'] = [{aField: 'aOriginalValue', cField: 'cOriginalValue'}];
        source.resource['objectArray'] = [{aField: 'aChangedValue', bField: 'bNewValue'}];

        const result = mergeDocument(target, source);

        expect(result.resource['objectArray'][0]['aField']).toEqual('aChangedValue');
        expect(result.resource['objectArray'][0]['bField']).toEqual('bNewValue');
        expect(result.resource['objectArray'][0]['cField']).toEqual('cOriginalValue');
    });


    it('merge objectArray field - create target object', () => {

        target.resource['objectArray'] = [];
        source.resource['objectArray'] = [{aField: 'aNewValue'}];

        const result = mergeDocument(target, source);

        expect(result.resource['objectArray'][0]['aField']).toEqual('aNewValue');
    });


    it('merge objectArray field - change one target object and add one target object', () => {

        target.resource['objectArray'] = [{aField: 'aOriginalValue'}];
        source.resource['objectArray'] = [{aField: 'aChangedValue'}, {bField: 'bNewValue'}];

        const result = mergeDocument(target, source);

        expect(result.resource['objectArray'][0]['aField']).toEqual('aChangedValue');
        expect(result.resource['objectArray'][1]['bField']).toEqual('bNewValue');
    });


    it('merge objectArray field - ignore null-valued field', () => {

        target.resource['objectArray'] = [{aField: 'aOriginalValue'}, {bField: 'bOriginalValue'}];
        source.resource['objectArray'] = [null, {bField: 'bChangedValue'}];

        const result = mergeDocument(target, source);

        expect(result.resource['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result.resource['objectArray'][1]['bField']).toEqual('bChangedValue');
    });


    it('merge objectArray field - ignore null-valued field, add array object', () => {

        target.resource['objectArray'] = [{aField: 'aOriginalValue'}];
        source.resource['objectArray'] = [null, {bField: 'bNewValue'}];

        const result = mergeDocument(target, source);

        expect(result.resource['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result.resource['objectArray'][1]['bField']).toEqual('bNewValue');
    });


    it('merge objectArray field - ignore null-valued field, add two array objects', () => {

        target.resource['objectArray'] = [{aField: 'aOriginalValue'}];
        source.resource['objectArray'] = [null, {bField: 'bNewValue'}, {cField: 'cNewValue'}];

        const result = mergeDocument(target, source);

        expect(result.resource['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result.resource['objectArray'][1]['bField']).toEqual('bNewValue');
        expect(result.resource['objectArray'][2]['cField']).toEqual('cNewValue');
    });


    it('merge objectArray field - ignore null-valued field, do not add array object, if this would result in empty entries', () => {

        target.resource['objectArray'] = [];
        source.resource['objectArray'] = [null, {bField: 'bNewValue'}];

        try {
            mergeDocument(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, 'identifier1']);
        }
    });


    it('merge objectArray field - create target objectArray', () => {

        source.resource['objectArray'] = [{aField: 'aNewValue'}];

        const result = mergeDocument(target, source);

        expect(result.resource['objectArray'][0]['aField']).toEqual('aNewValue');
    });


    it('dont overwrite identifier, id', () => {

        const source = {
            _id: 'id2',
            modified: [],
            created: undefined,
            resource: {
                id: 'id2',
                type: 'Object',
                identifier: 'identifier2',
                shortDescription: 'shortDescription2',
                anotherField: 'field2',
                relations: {}
            }
        };

        const result = mergeDocument(target, source);
        expect(result.resource.identifier).toEqual('identifier1');
        expect(result.resource.id).toEqual('id1');
        expect(result.resource.type).toEqual('Object');
        expect(result.resource.relations).toEqual({});
    });


    it('attempted to change type', () => {

        const source = {
            _id: 'id2',
            modified: [],
            created: undefined,
            resource: {
                id: 'id2',
                type: 'Object2',
                identifier: 'identifier1',
                shortDescription: 'shortDescription2',
                anotherField: 'field2',
                relations: {}
            }
        };

        try {
            mergeDocument(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.TYPE_CANNOT_BE_CHANGED, 'identifier1']);
        }
    })
});