import {ProjectConfiguration, Document} from 'idai-components-2';
import {DocumentHolder} from '../../../../app/components/docedit/document-holder';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DocumentHolder', () => {

    let document: Document;
    let changedDocument: Document;

    let docHolder;
    let datastore;
    let persistenceManager;


    beforeEach(() => {

        const pconf = new ProjectConfiguration({
            types: [{
                type: 'A',
                fields: [{name: 'id'},{name: 'type'},{name:'emptyfield'}]
            }],
            relations: [
                {
                    'domain': ['A'],
                    'inverse': 'bears',
                    'name': 'isFoundOn',
                    'range': ['Find']
                },
                {
                    'domain': ['A'],
                    'inverse': 'bears',
                    'name': 'isFoundOn2',
                    'range': ['Find']
                }
            ]
        });

        document = {
            resource: {
                type: 'A',
                id: '1',
                emptyfield: '',
                undeffield: 'some',
                relations: {
                    'isFoundOn' : [],
                    'isFoundOn2' : ['1'],
                    'undefrel' : ['2']
                }
            },
            modified: [],
            created: {user: 'a', date: new Date()}
        };

        const validator = jasmine.createSpyObj('Validator', ['validate']);
        persistenceManager = jasmine.createSpyObj('PersistenceManager', ['persist']);
        persistenceManager.persist.and.callFake((doc, b, c, d) => {
            changedDocument = doc;
            Promise.resolve(doc);
        });

        const usernameProvider = jasmine.createSpyObj('UsernameProvider', ['getUsername']);
        datastore = jasmine.createSpyObj('Datastore', ['get']);
        datastore.get.and.callFake((a, b) => changedDocument);

        docHolder = new DocumentHolder(
            pconf,
            persistenceManager,
            validator,
            undefined,
            undefined,
            usernameProvider,
            datastore
        );
        docHolder.clonedDocument = document;
    });


    it('remove empty and undefined relations', async done => {

        const savedDocument: Document = await docHolder.save();

        expect(Object.keys(savedDocument.resource.relations).length).toBe(1);
        expect(Object.keys(savedDocument.resource.relations)[0]).toBe('isFoundOn2');
        done();
    });


    it('remove empty and undefined fields', async done => {

        const savedDocument: Document = await docHolder.save();

        expect(savedDocument.resource.undeffield).toBeUndefined();
        expect(savedDocument.resource.emptyfield).toBeUndefined();
        expect(savedDocument.resource.type).not.toBeUndefined();
        done();
    });
});