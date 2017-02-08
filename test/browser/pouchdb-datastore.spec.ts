import {PouchdbDatastore} from "../../app/datastore/pouchdb-datastore";
import {M} from "../../app/m";
import {IdaiFieldDocument} from "../../app/model/idai-field-document";
import {Query} from "idai-components-2/datastore";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('PouchdbDatastore', () => {

        var datastore : PouchdbDatastore;

        function doc(identifier) : IdaiFieldDocument {
            return {
                resource : {
                    identifier: identifier,
                    shortDescription : "sd",
                    title: "title",
                    type: "object",
                    synced: 0,
                    relations : undefined
                },
                synced : 0
            }
        }

        beforeEach(
            function () {
                datastore = new PouchdbDatastore();
            }
        );

        afterEach(
            (done)=> {
                datastore.shutDown().then(()=>done());
            }
        );

        // it('should revert id on failed creation',
        it('should not create two documents with the same identifier',
            function (done) {

                datastore.create(doc('id1'))
                    .then(() => datastore.create(doc('id1')))
                    .then(
                        () => {
                            fail('expected promise to reject, not to resolve');
                            done();
                        },
                        err => {
                            expect(err).toBe(M.DATASTORE_IDEXISTS);
                            done();
                        }
                    );
            }
        );

        it('should not update a document with an existing identifier of another doc',
            function (done) {

                var doc2 = doc('id2');

                datastore.create(doc('id1'))
                    .then(() => datastore.create(doc2))
                    .then(() => {
                        doc2.resource.identifier = 'id1';
                        return datastore.update(doc2);
                    }).then(
                        () => {
                            fail('expected promise to reject, not to resolve'); done();
                        },
                        err => {
                            expect(err).toBe(M.DATASTORE_IDEXISTS);
                            done();
                        }
                    );
            }
        );

        it('should update an existing document with no identifier conflict',
            function (done) {

                var doc2 = doc('id2');

                datastore.create(doc('id1'))
                    .then(() => datastore.create(doc2))
                    .then(() => {
                        return datastore.update(doc2);
                    }).then(
                    () => {
                        done();
                    },
                    err => {
                        fail();
                        done();
                    }
                );
            }
        );

        it('should return the cached instance on calling find',
            function (done) {

                var doc1 = doc('id1');

                datastore.create(doc1)
                    .then(() => datastore.find({q:'id1'}))
                    .then(
                        result => {
                            doc1.resource.identifier = 'i4';
                            expect(result[0].resource['identifier']).toBe('i4');
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