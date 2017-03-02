import {PouchdbDatastore} from "../../app/datastore/pouchdb-datastore";
import {Document} from "idai-components-2/core";

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function main() {
    describe('PouchdbDatastore', () => {

        let datastore : PouchdbDatastore;

        function doc(sd,identifier?,type?) : Document {
            if (!type) type = 'object';
            return {
                resource : {
                    shortDescription: sd,
                    identifier: identifier,
                    title: 'title',
                    type: type,
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
                .then(() => datastore.find('sd1'))
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

        it('should not find with query undefined',function(done){
            let doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.find(undefined))
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

        it('should find with prefix query undefined',function(done){
            let doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.find(undefined, undefined, true))
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
                .then(() => datastore.find('bla'))
                .then(
                    result => {
                        expect(result.length).toBe(2);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should find by identifier',function(done){
            let doc1 = doc('bla','blub');
            let doc2 = doc('blub','bla');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.findByIdentifier('bla'))
                .then(
                    result => {
                        expect(result.resource['shortDescription']).toBe('blub');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter by one type in find',function(done){
            let doc1 = doc('bla1','blub','type1');
            let doc2 = doc('bla2','blub','type2');
            let doc3 = doc('bla3','blub','type3');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.find('blub', ['type3']))
                .then(
                    result => {
                        expect(result.length).toBe(1);
                        expect(result[0].resource['shortDescription']).toBe('bla3');
                        expect(result[0].resource.type).toBe('type3');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter by several types in find',function(done){
            let doc1 = doc('bla1','blub','type1');
            let doc2 = doc('bla2','blub','type2');
            let doc3 = doc('bla3','blub','type3');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.find('blub', ['type2','type3']))
                .then(
                    result => {
                        expect(result.length).toBe(2);
                        expect(result[0].resource['shortDescription']).not.toBe('bla1');
                        expect(result[0].resource.type).not.toBe('type1');
                        expect(result[1].resource['shortDescription']).not.toBe('bla1');
                        expect(result[1].resource.type).not.toBe('type1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should find by prefix query and filter',function(done){
            let doc1 = doc('bla1','blub1','type1');
            let doc2 = doc('bla2','blub2','type2');
            let doc3 = doc('bla3','blub3','type3');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.find('blub', ['type2','type3'], true))
                .then(
                    result => {
                        expect(result.length).toBe(2);
                        expect(result[0].resource['shortDescription']).not.toBe('bla1');
                        expect(result[0].resource.type).not.toBe('type1');
                        expect(result[1].resource['shortDescription']).not.toBe('bla1');
                        expect(result[1].resource.type).not.toBe('type1');
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