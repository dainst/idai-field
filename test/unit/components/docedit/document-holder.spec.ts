import {DocumentHolder} from '../../../../app/components/docedit/document-holder';
import {ProjectConfiguration} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
describe('DocumentHolder', () => {

    let docHolder;
    let d;
    let datastore;

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

        d = {
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
        const pacman = jasmine.createSpyObj('PersistenceManager', ['persist']);
        pacman.persist.and.callFake((doc,b,c,d) => Promise.resolve(doc));
        const usernameProvider = jasmine.createSpyObj('UsernameProvider', ['getUsername']);
        datastore = jasmine.createSpyObj('Datastore', ['get']);

        docHolder = new DocumentHolder(
            pconf,
            pacman,
            validator,
            undefined,
            undefined,
            usernameProvider,
            datastore
        );
    });


    it('remove empty and undefined relations', async done => {

        docHolder.clonedDocument = d;
        datastore.get.and.callFake((a,b) => docHolder.clonedDocument);
        await docHolder.save();

        expect(Object.keys(docHolder.clonedDocument.resource.relations).length).toBe(1);
        expect(Object.keys(docHolder.clonedDocument.resource.relations)[0]).toBe('isFoundOn2');
        done();
    });


    it('remove empty and undefined fields', async done => {

        docHolder.clonedDocument = d;
        datastore.get.and.callFake((_,__) => docHolder.clonedDocument);
        await docHolder.save();

        expect(docHolder.clonedDocument.resource.undeffield).toBeUndefined();
        expect(docHolder.clonedDocument.resource.emptyfield).toBeUndefined();
        expect(docHolder.clonedDocument.resource.type).not.toBeUndefined();
        done();
    });
});