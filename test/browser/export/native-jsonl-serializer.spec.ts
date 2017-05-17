import {NativeJsonlSerializer} from '../../../app/export/native-jsonl-serializer';
import {Document} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 */
export function main() {

    const testDocuments: Array<Document> = [
        {
            'created': new Date(),
            'modified': new Date(),
            'resource': {
                'id': 'id1',
                'type': 'object',
                'identifier': 'test1',
                'shortDescription': 'Test 1',
                'relations': {}
            }
        },
        {
            'created': new Date(),
            'modified': new Date(),
            'resource': {
                'id': 'id2',
                'type': 'object',
                'identifier': 'test2',
                'shortDescription': 'Test 2',
                'relations': {}
            }
        }
    ];

    describe('NativeJsonlSerializer', () => {

        it('should serialize resources to the native jsonl format', () => {

            const expectedResult = '{"id":"id1","type":"object","identifier":"test1","shortDescription":"Test 1",' +
                '"relations":{}}\n{"id":"id2","type":"object","identifier":"test2","shortDescription":"Test 2",' +
                '"relations":{}}\n';

            const serializer: NativeJsonlSerializer = new NativeJsonlSerializer();
            const result: string = serializer.serialize(testDocuments);

            expect(result).toEqual(expectedResult);
        });


    });
}