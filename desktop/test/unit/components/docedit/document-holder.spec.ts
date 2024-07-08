import { describe, expect, test, beforeEach } from '@jest/globals';
import { Document, ProjectConfiguration, Forest, IdGenerator } from 'idai-field-core';
import { DocumentHolder } from '../../../../src/app/components/docedit/document-holder';
import { M } from '../../../../src/app/components/messages/m';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DocumentHolder', () => {

    let defaultDocument: Document;
    let changedDocument: Document;

    let documentHolder;
    let validator;


    beforeEach(() => {

        const projectConfiguration = new ProjectConfiguration({
            forms: Forest.build(
                [
                    [{
                        name: 'Trench',
                        groups: [{ name: 'stem', fields: [
                            { name: 'id' },
                            { name: 'category' },
                            { name: 'emptyField' }
                        ]}]
                    }, []],
                    [{
                        name: 'Find',
                        groups: [{
                            name: 'stem', fields: [
                                { name: 'id' },
                                { name: 'category' },
                                { name: 'unsignedIntField', inputType: 'unsignedInt' },
                                { name: 'unsignedFloatField', inputType: 'unsignedFloat' },
                                { name: 'floatField', inputType: 'float' }
                            ]
                        }]
                    }, []]
                ]) as any,
            categories: {},
            relations: [
                {
                    name: 'isFoundOn',
                    inverse: 'bears',
                    domain: ['Trench'],
                    range: ['Find'],
                    editable: false,
                    visible: false,
                    inputType: 'relation'
                },
                {
                    name: 'isFoundOn2',
                    inverse: 'bears',
                    domain: ['Trench'],
                    range: ['Find'],
                    editable: false,
                    visible: false,
                    inputType: 'relation'
                },
                {
                    name: 'isRecordedIn',
                    domain: ['Find'],
                    range: ['Trench'],
                    editable: false,
                    visible: false,
                    inputType: 'relation'
                }
            ],
            commonFields: {},
            valuelists: {},
            projectLanguages: []
        });

        defaultDocument = {
            _id: '1',
            resource: {
                category: 'Trench',
                id: '1',
                emptyField: '',
                onlyWhitespaceField: '   ',
                textAndWhitespaceField: '  abc ',
                undefinedField: 'some',
                relations: {
                    'isFoundOn': [],
                    'isFoundOn2': ['1'],
                    'undefrel': ['2']
                }
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        validator = {
            assertIsRecordedInTargetsExist: jest.fn(),
            assertIdentifierIsUnique: jest.fn(),
            assertHasIsRecordedIn: jest.fn(),
            assertNoFieldsMissing: jest.fn(),
            assertCorrectnessOfNumericalValues: jest.fn(),
            assertGeometryIsValid: jest.fn()
        };

        const persistenceManager: any = {
            update: jest.fn((doc, _, __, ___) => {
                changedDocument = doc;
                return Promise.resolve(changedDocument);
            })
        };
        
        const datastore: any = {
            get: jest.fn((_, __) => changedDocument)
        };

        documentHolder = new DocumentHolder(
            projectConfiguration,
            persistenceManager,
            validator,
            datastore,
            new IdGenerator()
        );
    });


    test('remove empty and undefined fields', async () => {

        const cloned = Document.clone(defaultDocument);
        delete cloned.resource.undefinedField;
        documentHolder.setDocument(cloned);

        documentHolder.clonedDocument = defaultDocument;
        const savedDocument: Document = await documentHolder.save();

        expect(savedDocument.resource.undefinedField).toBeUndefined();
        expect(savedDocument.resource.emptyField).toBeUndefined();
        expect(savedDocument.resource.onlyWhitespaceField).toBeUndefined();
        expect(savedDocument.resource.category).not.toBeUndefined();
    });


    test('remove leading and trailing whitespace from strings', async () => {

        documentHolder.setDocument(defaultDocument);
        const savedDocument: Document = await documentHolder.save();

        expect(savedDocument.resource.textAndWhitespaceField).toEqual('abc');
    });


    test('do not remove undefined field if it was part of the original object', async () => {

        documentHolder.setDocument(defaultDocument);
        const savedDocument: Document = await documentHolder.save();
        expect(savedDocument.resource.undefinedField).toEqual('some');
    });


    test('do not remove undefined relation if it was part of the original object', async () => {

        documentHolder.setDocument(defaultDocument);
        const savedDocument: Document = await documentHolder.save();
        expect(savedDocument.resource.relations.undefrel[0]).toEqual('2');
    });


    test('throw exception if isRecordedIn relation is missing', async () => {

        validator.assertHasIsRecordedIn.mockImplementation(() => { throw [M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN]; });

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Find',
                id: '1',
                identifier: '1',
                relations: {}
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        documentHolder.setDocument(document);

        try {
            await documentHolder.save();
            throw new Error('Test failure');
        } catch (e) {
            expect(e).toEqual([M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN]);
        }
    });


    test('do not throw exception if isRecordedIn relation is found', async () => {

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Find',
                id: '1',
                identifier: '1',
                relations: {
                    isRecordedIn: ['tX']
                }
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        documentHolder.setDocument(document);

        await documentHolder.save();
    });


    test('do not throw exception if no isRecordedIn relation is expected', async () => {

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Trench',
                id: '1',
                identifier: '1',
                relations: {}
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        documentHolder.setDocument(document);

        await documentHolder.save();
    });


    test('convert strings to numbers for int & float fields', async () => {

        const document: Document = {
            _id: '1',
            resource: {
                category: 'Find',
                id: '1',
                identifier: '1',
                unsignedIntField: '7',
                unsignedFloatField: '7.49',
                floatField: '-7.49',
                relations: {}
            } as any,
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        documentHolder.setDocument(document);
        const savedDocument = await documentHolder.save();

        expect(savedDocument.resource.unsignedIntField).toBe(7);
        expect(savedDocument.resource.unsignedFloatField).toBe(7.49);
        expect(savedDocument.resource.floatField).toBe(-7.49);
    });
});
