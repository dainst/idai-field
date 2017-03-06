import {PouchdbDatastore} from "../../../app/datastore/pouchdb-datastore";
import {Document} from "idai-components-2/core";
import {CachedDatastore} from "../../../app/datastore/cached-datastore";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('CachedDatastore', () => {

        let datastore : CachedDatastore;
        let pouchdb : PouchdbDatastore;

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

        function doc(sd,identifier?) : Document {
            return {
                resource : {
                    shortDescription: sd,
                    identifier: identifier,
                    title: "title",
                    type: "object",
                    relations : undefined
                }
            }
        }

        beforeEach(
            function () {
                pouchdb = new PouchdbDatastore('testdb', mockConfigLoader);
                datastore = new CachedDatastore(pouchdb);
            }
        );

        afterEach(
            (done)=> {
                pouchdb.shutDown().then(()=>done());
            }
        );


        it('should return the cached instance on calling find',
            function (done) {

                let doc1 = doc('sd1');

                datastore.create(doc1)
                    .then(() => datastore.find({q: 'sd1'}))
                    .then(
                        result => {
                            doc1.resource['shortDescription'] = 's4';
                            expect((result[0] as Document).resource['shortDescription']).toBe('s4');
                            done();
                        },
                        err => {
                            fail(err);
                            done();
                        }
                    );
            }
        );
    })
}