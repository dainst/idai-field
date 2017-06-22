import {PouchdbDatastore} from "../../../app/datastore/pouchdb-datastore";
import {Document} from "idai-components-2/core";
import {CachedDatastore} from "../../../app/datastore/cached-datastore";
import {PouchdbManager} from "../../../app/datastore/pouchdb-manager";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('CachedDatastore', () => {

        let datastore: CachedDatastore;
        let pouchdb: PouchdbDatastore;
        let pouchdbManager: PouchdbManager;

        let mockProjectConfiguration = jasmine.createSpyObj(
            'mockProjectConfiguration',
            ['getParentTypes']
        );
        mockProjectConfiguration.getParentTypes.and.callFake(type => {
            if (type == 'root') return [];
            if (type == 'type1') return ['root'];
            if (type == 'type1.1') return ['type1','root'];
            if (type == 'type2') return ['root'];
        });

        let mockConfigLoader = jasmine.createSpyObj(
            'mockConfigLoader',
            [ 'getProjectConfiguration' ]
        );
        mockConfigLoader.getProjectConfiguration
            .and.callFake(() => Promise.resolve(mockProjectConfiguration));

        function doc(sd, identifier?): Document {
            return {
                resource: {
                    shortDescription: sd,
                    identifier: identifier,
                    title: "title",
                    type: "object",
                    relations: {}
                }
            }
        }

        beforeEach(
            function () {
                spyOn(console, 'debug'); // to suppress console.debug output
                spyOn(console, 'error'); // to suppress console.error output
                pouchdbManager = new PouchdbManager(mockConfigLoader);
                pouchdb = new PouchdbDatastore(mockConfigLoader, pouchdbManager);
                pouchdbManager.select('testdb');
                datastore = new CachedDatastore(pouchdb);
            }
        );

       afterEach(function(done) {
           pouchdbManager.destroy().then(() => done());
        });

       it('should return the cached instance on calling find', function(done) {

            let doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.find({q: 'sd1'}))
                .then(result => {
                    doc1.resource['shortDescription'] = 's4';
                    expect((result[0] as Document).resource['shortDescription']).toBe('s4');
                    done();
                }).catch(err => {
                    fail(err);
                    done();
                });
        });
    });
}