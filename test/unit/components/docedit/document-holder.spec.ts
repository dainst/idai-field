import {ProjectConfiguration, Document} from 'idai-components-2';
import {DocumentHolder} from '../../../../app/components/docedit/document-holder';
import {M} from '../../../../app/m';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DocumentHolder', () => {

    let defaultDocument: Document;
    let changedDocument: Document;

    let docHolder;
    let datastore;


    beforeEach(() => {

        const pconf = new ProjectConfiguration({
            types: [{
                type: 'Trench',
                fields: [{ name: 'id' }, { name: 'type' }, { name: 'emptyfield' }]
            }, {
                type: 'Find',
                fields: [{ name: 'id' }, { name: 'type' }]
            }],
            relations: [
                {
                    'name': 'isFoundOn',
                    'inverse': 'bears',
                    'domain': ['Trench'],
                    'range': ['Find']
                },
                {
                    'name': 'isFoundOn2',
                    'inverse': 'bears',
                    'domain': ['Trench'],
                    'range': ['Find']
                },
                {
                    'name': 'isRecordedIn',
                    'domain': ['Find'],
                    'range': ['Trench']
                }
            ]
        });

        defaultDocument = {
            resource: {
                type: 'Trench',
                id: '1',
                emptyfield: '',
                undeffield: 'some',
                relations: {
                    'isFoundOn': [],
                    'isFoundOn2': ['1'],
                    'undefrel': ['2']
                }
            },
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        const validator = jasmine.createSpyObj('Validator', ['validate']);

        const persistenceManager = jasmine.createSpyObj('PersistenceManager', ['persist']);
        persistenceManager.persist.and.callFake((doc, b, c, d) => {
            changedDocument = doc;
            return Promise.resolve(changedDocument);
        });

        const typeUtility = jasmine.createSpyObj('TypeUtility', ['getSubtypes']);
        typeUtility.getSubtypes.and.callFake(typeName => {
            return typeName === 'Operation'
                ? { 'Operation': { name: 'o' }, 'Trench': {} }
                : { 'Image': {}, 'Drawing': {} }
        });

        const usernameProvider = jasmine.createSpyObj('UsernameProvider', ['getUsername']);
        datastore = jasmine.createSpyObj('Datastore', ['get']);
        datastore.get.and.callFake((a, b) => changedDocument);

        docHolder = new DocumentHolder(
            pconf,
            persistenceManager,
            validator,
            undefined,
            typeUtility,
            usernameProvider,
            datastore
        );
    });


    it('remove empty and dont remove undefined relations', async done => {

        docHolder.clonedDocument = defaultDocument;
        const savedDocument: Document = await docHolder.save();

        expect(Object.keys(savedDocument.resource.relations).length).toBe(2);
        expect(Object.keys(savedDocument.resource.relations)[0]).toBe('isFoundOn2');
        expect(Object.keys(savedDocument.resource.relations)[1]).toBe('undefrel');
        done();
    });


    it('remove empty and dont remove undefined fields', async done => {

        docHolder.clonedDocument = defaultDocument;
        const savedDocument: Document = await docHolder.save();

        expect(savedDocument.resource.undeffield).not.toBeUndefined();
        expect(savedDocument.resource.emptyfield).toBeUndefined();
        expect(savedDocument.resource.type).not.toBeUndefined();
        done();
    });


    it('throw exception if isRecordedIn relation is missing', async done => {

        const document: Document = {
            resource: {
                type: 'Find',
                id: '1',
                identifier: '1',
                relations: {}
            },
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        docHolder.clonedDocument = document;

        try {
            await docHolder.save();
            fail();
            done();
        } catch (e) {
            expect(e).toEqual([M.VALIDATION_ERROR_NORECORDEDIN]);
            done();
        }
    });


    it('do not throw exception if isRecordedIn relation is found', async done => {

        const document: Document = {
            resource: {
                type: 'Find',
                id: '1',
                identifier: '1',
                relations: {
                    isRecordedIn: ['tX']
                }
            },
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        docHolder.clonedDocument = document;

        try {
            await docHolder.save();
            done();
        } catch (e) {
            fail();
            done();
        }
    });


    it('do not throw exception if no isRecordedIn relation is expected', async done => {

        const document: Document = {
            resource: {
                type: 'Trench',
                id: '1',
                identifier: '1',
                relations: {}
            },
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        docHolder.clonedDocument = document;

        try {
            await docHolder.save();
            done();
        } catch (e) {
            fail();
            done();
        }
    });
});