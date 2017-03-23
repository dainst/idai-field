import {PouchdbDatastore} from "../../../app/datastore/pouchdb-datastore";
import {Document} from "idai-components-2/core";
import {M} from "../../../app/m";

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function main() {

    beforeEach(
        function(){
            spyOn(console, 'debug'); // to suppress console.error output
        }
    );

    describe('PouchdbDatastore', () => {

        let datastore : PouchdbDatastore;

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
                datastore = new PouchdbDatastore('testdb', mockConfigLoader);
            }
        );

        afterEach(
            (done)=> {
                datastore.shutDown().then(()=>done());
            }
        );

        it('should create a document and create a resource.id',
            function (done) {

                datastore.create(doc('sd1'))
                    .then(
                    _createdDoc => {
                        let createdDoc = _createdDoc as Document;
                        expect(createdDoc.resource.id).not.toBe(undefined);
                        done();
                    },
                    err => {
                        fail();
                        done();
                    }
                );
            }
        );

        it('should create a document and take the existing resource.id',
            function (done) {

                let docToCreate: Document = doc('sd1');
                docToCreate.resource.id = 'a1';

                datastore.create(docToCreate)
                    // this step was added to adress a problem where a document
                    // with an existing resource.id was stored but could not
                    // get refreshed later
                    .then(() => datastore.refresh(docToCreate))
                    // and the same may occur on get
                    .then(() => datastore.get(docToCreate.resource.id))
                    .then(
                        _createdDoc => {
                            let createdDoc = _createdDoc as Document;
                            expect(createdDoc.resource.id).toBe('a1');
                            done();
                        },
                        err => {
                            fail();
                            done();
                        }
                    );
            }
        );

        it('should not create a document with the resource.id of an alredy existing doc',
            function (done) {

                let docToCreate1: Document = doc('sd1');
                docToCreate1.resource.id = 'a1';
                let docToCreate2: Document = doc('sd1');
                docToCreate2.resource.id = 'a1';

                datastore.create(docToCreate1)
                    .then(() => datastore.create(docToCreate2))
                    .then(
                        () => {
                            fail();
                            done();
                        },
                        msgWithParams => {
                            expect(msgWithParams).toEqual([M.DATASTORE_RESOURCE_ID_EXISTS]);
                            done();
                        }
                    );
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

        it('should reject with keyOfM in when trying to get a non existing document',
            function (done) {

                datastore.create(doc('id1')) // TODO omit this to reproduce the closing db bug, remove this after fixing it
                    .then(() => datastore.get('nonexisting'))
                    .then(
                        () => {
                            fail();
                            done();
                        },
                        msgWithParams => {
                            expect(msgWithParams).toEqual([M.DATASTORE_NOT_FOUND]);
                            done();
                        }
                    );
            }
        );

        it('should reject with keyOfM in when trying to refresh a non existing document',
            function (done) {

                let non = doc('sd2');

                datastore.create(doc('id1'))
                    .then(() => datastore.refresh(non))
                    .then(
                        () => {
                            fail();
                            done();
                        },
                        msgWithParams => {
                            expect(msgWithParams).toEqual([M.DATASTORE_NOT_FOUND]);
                            done();
                        }
                    );
            }
        );

        it('should find with filterSet undefined', function(done){
            let doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.find({q: 'sd1'}))
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

        it('should not find with query undefined', function(done){
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

        it('should find with prefix query undefined', function(done){
            let doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.find({q: undefined, prefix: true}))
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

        it('should match all fields', function(done){
            let doc1 = doc('bla','blub');
            let doc2 = doc('blub','bla');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.find({q: 'bla'}))
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

        it('should find by identifier', function(done){
            const doc1 = doc('bla','blub');
            const doc2 = doc('blub','bla');

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

        it("should reject when can't find by identifier", function(done){
            const doc1 = doc('bla','blub');

            datastore.create(doc1)
                .then(() => datastore.findByIdentifier('abc'))
                .then(
                    result => {
                        fail('should not find anything');
                        done();
                    },
                    msgWithParams => {
                        expect(msgWithParams).toEqual([M.DATASTORE_NOT_FOUND]);
                        done();
                    }
                );
        });

        it("should reject when called with undefined", function(done){
            const doc1 = doc('bla','blub');

            datastore.create(doc1)
                .then(() => datastore.findByIdentifier(undefined))
                .then(
                    result => {
                        fail('should not find anything but found '+JSON.stringify(result));
                        done();
                    },
                    msgWithParams => {
                        expect(msgWithParams).toEqual([M.DATASTORE_NOT_FOUND]);
                        done();
                    }
                );
        });


        it('should filter by one type in find', function(done){
            let doc1 = doc('bla1','blub','type1');
            let doc2 = doc('bla2','blub','type2');
            let doc3 = doc('bla3','blub','type3');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.find({q: 'blub', type: 'type3'}))
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

        it('should filter by parent type in find', function(done){
            let doc1 = doc('blub','bla1','type1');
            let doc2 = doc('blub','bla2','type2');
            let doc3 = doc('blub','bla1.1','type1.1');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.find({q: 'blub', type: 'type1'}))
                .then(result => {
                    expect(result.length).toBe(2);
                    expect(result[0].resource['shortDescription']).not.toBe('bla2');
                    expect(result[0].resource.type).not.toBe('type2');
                    expect(result[1].resource['shortDescription']).not.toBe('bla2');
                    expect(result[1].resource.type).not.toBe('type2');
                })
                .then(() => datastore.find({q: 'blub', type: 'root'}))
                .then(result => {
                    expect(result.length).toBe(3);
                    done();
                },
                err => {
                    fail(err);
                    done();
                }
            );;
        });

        it('should find by prefix query and filter', function(done){
            let doc1 = doc('bla1','blub1','type1');
            let doc2 = doc('bla2','blub2','type2');
            let doc3 = doc('bla3','blub3','type2');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.find({
                    q: 'blub',
                    type: 'type2',
                    prefix: true
                }))
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

        it('should show all sorted by lastModified', function(done){
            let doc1 = doc('bla1','blub1','type1');
            let doc2 = doc('bla2','blub2','type2');
            let doc3 = doc('bla3','blub3','type3');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.all())
                .then(
                    result => {
                        expect(result.length).toBe(3);
                        expect(result[0].resource['shortDescription']).toBe('bla3');
                        expect(result[1].resource['shortDescription']).toBe('bla2');
                        expect(result[2].resource['shortDescription']).toBe('bla1');
                        done();
                    },
                    err => {
                        console.log(err);
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter by parent type in all', function(done){
            let doc1 = doc('blub','bla1','type1');
            let doc2 = doc('blub','bla2','type2');
            let doc3 = doc('blub','bla1.1','type1.1');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.all('type1'))
                .then(
                    result => {
                        expect(result.length).toBe(2);
                        expect(result[0].resource['identifier']).toBe('bla1.1');
                        expect(result[1].resource['identifier']).toBe('bla1');
                        done();
                    },
                    err => {
                        console.log(err);
                        fail(err);
                        done();
                    }
                );
        });

    })
}