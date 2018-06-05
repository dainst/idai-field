import {DocumentHolder} from '../../../../app/components/docedit/document-holder';
import {ProjectConfiguration} from 'idai-components-2/core';

/**
 * @author Daniel de Oliveira
 */
describe('DocumentHolder', () => {

    it('remove empty relations', async done => {

        const pconf = new ProjectConfiguration({
            types: [],
            relations: [
                {
                    "domain": ["A"],
                    "inverse": "bears",
                    "name": "isFoundOn",
                    "range": ["Find"]
                }
            ]
        });

        const d = {
            resource: {
                type: "A",
                id: "1",
                relations: {
                    'isFoundOn' : []
                }
            },
            modified: [],
            created: {user: "a", date: new Date()}
        };

        const validator = jasmine.createSpyObj('Validator', ['validate']);
        const pacman = jasmine.createSpyObj('PersistenceManager', ['persist']);
        pacman.persist.and.returnValue(Promise.resolve(d));
        const usernameProvider = jasmine.createSpyObj('UsernameProvider', ['getUsername']);
        const cmon = jasmine.createSpyObj('DocumentEditChangesMonitor', ['reset']);
        const datastore = jasmine.createSpyObj('Datastore', ['get']);
        datastore.get.and.returnValue(Promise.resolve(d));

        const docHolder = new DocumentHolder(
            pconf,
            pacman,
            validator,
            undefined,
            undefined,
            usernameProvider,
            cmon,
            datastore
        );

        docHolder.clonedDocument = d;
        await docHolder.save();

        expect(Object.keys(docHolder.clonedDocument.resource.relations).length).toBe(0);
        done();
    });
});