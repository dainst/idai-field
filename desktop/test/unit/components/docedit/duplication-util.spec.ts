import { NewDocument, Document } from 'idai-field-core';
import { DuplicationUtil } from '../../../../src/app/components/docedit/duplication-util';


/**
 * @author Thomas Kleinke
 */

describe('DuplicationUtil', () => {

    let validator;
    let identifiers = [];


    beforeAll(() => {

        validator = {
            assertIdentifierIsUnique: jest.fn(async (document: NewDocument) => {
                if (identifiers.includes(document.resource.identifier)) throw 'duplicate identifier';
            })
        };
    });


    test('do not include non-hierarchy relations, id and geometry in template', () => {

        const document: Document = {
            _id: 't1',
            resource: {
                id: 't1',
                identifier: 'test1',
                relations: {
                    isRecordedIn: ['t2'],
                    liesWithin: ['t3'],
                    borders: ['t4']
                },
                geometry: {
                    type: 'Point',
                    coordinates: [1.0, 1.0]
                },
                category: 'Find'
            },
            created: {
                user: 'testuser',
                date: new Date()
            },
            modified: []
        };

        const template: NewDocument = DuplicationUtil.createTemplate(document);

        expect(template.resource.id).toBeUndefined();
        expect(template.resource.relations.isRecordedIn).toEqual(['t2']);
        expect(template.resource.relations.liesWithin).toEqual(['t3']);
        expect(template.resource.relations.borders).toBeUndefined();
        expect(template.resource.geometry).toBeUndefined();
    });


    test('split identifiers', () => {

       expect(DuplicationUtil.splitIdentifier('test1'))
           .toEqual({ baseIdentifier: 'test', identifierNumber: 1, minDigits: 1 });

        expect(DuplicationUtil.splitIdentifier('test123'))
            .toEqual({ baseIdentifier: 'test', identifierNumber: 123, minDigits: 3 });

        expect(DuplicationUtil.splitIdentifier('test123-456'))
            .toEqual({ baseIdentifier: 'test123-', identifierNumber: 456, minDigits: 3 });

        expect(DuplicationUtil.splitIdentifier('test'))
            .toEqual({ baseIdentifier: 'test', identifierNumber: 1, minDigits: 1 });

        expect(DuplicationUtil.splitIdentifier('123'))
            .toEqual({ baseIdentifier: '', identifierNumber: 123, minDigits: 3 });

        expect(DuplicationUtil.splitIdentifier('test-0001'))
            .toEqual({ baseIdentifier: 'test-', identifierNumber: 1, minDigits: 4 });
    });


    test('set unique identifier', async () => {

        identifiers = ['test1', 'test2', 'test3'];
        const document: NewDocument = { resource: { identifier: 'test1', relations: {}, category: 'Find' } };

        await DuplicationUtil.setUniqueIdentifierForDuplicate(
            document, 'test', 1, 1, validator
        );

        expect(document.resource.identifier).toEqual('test4');
    });


    test('keep min number of digits', async () => {

        identifiers = ['test-0001'];
        const document: NewDocument = { resource: { identifier: 'test-0001', relations: {}, category: 'Find' } };

        await DuplicationUtil.setUniqueIdentifierForDuplicate(
            document, 'test-', 1, 4, validator
        );

        expect(document.resource.identifier).toEqual('test-0002');
    });
});
