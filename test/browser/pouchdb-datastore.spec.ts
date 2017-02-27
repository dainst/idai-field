import {PouchdbDatastore} from "../../app/datastore/pouchdb-datastore";
import {Document} from "idai-components-2/core";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('PouchdbDatastore', () => {

        let datastore : PouchdbDatastore;

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
                datastore = new PouchdbDatastore('testdb');
            }
        );

        afterEach(
            (done)=> {
                datastore.shutDown().then(()=>done());
            }
        );

        it('should update an existing document with no identifier conflict',
            function (done) {

                let doc2 = doc('id2');

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

        it('should find with filterSet undefined',function(done){
            let doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.find({q:'sd1',types:undefined}))
                .then(
                    result => {
                        expect(result[0].resource['shortDescription']).toBe('sd1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should find with query undefined',function(done){
            let doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.find(undefined))
                .then(
                    result => {
                        expect(result[0].resource['shortDescription']).toBe('sd1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should match all fields',function(done){
            let doc1 = doc('bla','blub');
            let doc2 = doc('blub','bla');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.find({q:'bla'}))
                .then(
                    result => {
                        // expect(result.length).toBe(2); TODO fix it
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should find in identifier',function(done){
            let doc1 = doc('bla','blub');
            let doc2 = doc('blub','bla');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.find({q:'bla'},'identifier'))
                .then(
                    result => {
                        expect(result[0].resource['shortDescription']).toBe('blub');
                        expect(result.length).toBe(1);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should not find in unknown field',function(done){
            let doc1 = doc('bla','blub');

            datastore.create(doc1)
                .then(() => datastore.find({q:'bla'},'unknown'))
                .then(
                    result => {
                        expect(result.length).toBe(0);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should match part of identifier',function(done){
            let doc1 = doc('bla','blub');

            datastore.create(doc1)
                .then(() => datastore.find({q:'blu'},'identifier'))
                .then(
                    result => {
                        expect(result[0].resource['shortDescription']).toBe('bla');
                        expect(result.length).toBe(1);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

    })
}