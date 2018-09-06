/**
 * @author Daniel de Oliveira
 */
import {Document} from 'idai-components-2';
import {DocumentMerge} from '../../../../app/core/import/document-merge';


describe('DocumentMerge', () => {

    const target: Document = {

        modified: [],
        created: undefined,
        resource: {
            id: 'id1',
            type: 'Object',
            identifier: 'identifier1',
            shortDescription: 'shortDescription1',
            anotherField: 'field1',
            relations: {}
        }
    };


    it('overwrite fields', () => {

        const source = {

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

        const result = DocumentMerge.merge(target, source);
        expect(result.resource.shortDescription).toEqual('shortDescription2');
        expect(result.resource.anotherField).toEqual('field2');
    });


    it('dont overwrite identifier', () => {

        const source = {

            modified: [],
            created: undefined,
            resource: {
                id: 'id1',
                type: 'Object',
                identifier: 'identifier2',
                shortDescription: 'shortDescription2',
                anotherField: 'field2',
                relations: {}
            }
        };

        const result = DocumentMerge.merge(target, source);
        expect(result.resource.identifier).toEqual('identifier1');
    });
});