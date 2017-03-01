import {PouchdbDatastore} from "../../app/datastore/pouchdb-datastore";
import {Document} from "idai-components-2/core";
import {CachedDatastore} from "../../app/datastore/cached-datastore";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('CachedDatastore', () => {

        let datastore : CachedDatastore;
        let pouchdb : PouchdbDatastore;

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
                pouchdb = new PouchdbDatastore('testdb');
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
                    .then(() => datastore.find('sd1'))
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