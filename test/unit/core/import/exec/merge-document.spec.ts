/**
 * @author Daniel de Oliveira
 */
import {Document} from 'idai-components-2';
import {mergeDocument} from '../../../../../app/core/import/exec/process/merge-document';
import {ImportErrors} from '../../../../../app/core/import/exec/import-errors';


describe('mergeDocument', () => {

    const target: Document = {
        _id: 'id1',
        modified: [],
        created: undefined,
        resource: {
            id: 'id1',
            type: 'Object',
            identifier: 'identifier1',
            shortDescription: 'shortDescription1',
            anotherField: 'field1',
            relations: { }
        }
    };


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