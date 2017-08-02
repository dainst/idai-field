import {PouchdbDatastore} from "../../../app/datastore/pouchdb-datastore";
import {Document} from "idai-components-2/core";
import {DatastoreErrors} from "idai-components-2/datastore";
import {M} from "../../../app/m";
import {PouchdbManager} from "../../../app/datastore/pouchdb-manager";
import {Query} from "idai-components-2/src/app/datastore/query";

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function main() {

    describe('PouchdbDatastore', () => {

        let datastore: PouchdbDatastore;
        let pouchdbManager: PouchdbManager;

        const mockConfigLoader = jasmine.createSpyObj(
            'mockConfigLoader',
            [ 'getProjectConfiguration' ]
        );

        const mockProjectConfiguration = jasmine.createSpyObj(
            'mockProjectConfiguration',
            ['getParentTypes']
        );

        mockProjectConfiguration.getParentTypes.and.callFake(type => {
            if (type == 'root') return [];
            if (type == 'type1') return ['root'];
            if (type == 'type1.1') return ['type1','root'];
            if (type == 'type2') return ['root'];
        });

        mockConfigLoader.getProjectConfiguration
            .and.callFake(() => Promise.resolve(mockProjectConfiguration));


        beforeEach(
            () => {
                spyOn(console, 'debug'); // to suppress console.debug output
                spyOn(console, 'error'); // to suppress console.error output
                spyOn(console, 'warn');
                pouchdbManager = new PouchdbManager(mockConfigLoader);
                datastore = new PouchdbDatastore(mockConfigLoader, pouchdbManager);
                pouchdbManager.select('testdb');
            }
        );

        afterEach(
            (done)=> {
                pouchdbManager.destroy()
                    .then(() => new PouchDB('testdb2').destroy())
                    .then(()=>done());
            }, 5000
        );

        function doc(sd,identifier?,type?,id?) : Document {
            if (!type) type = 'object';
            const doc = {
                resource : {
                    shortDescription: sd,
                    identifier: identifier,
                    title: 'title',
                    type: type,
                    relations : {}
                },
                created: {
                    user: 'anonymous',
                    date: new Date()
                }
            };
            if (id) {
                doc['_id'] = id;
                doc.resource['id'] = id;
            }
            return doc;
        }

        const expectErr = function(promise,expectedMsgWithParams,done) {
            promise().then(
                result => {
                    fail('rejection with '+ expectedMsgWithParams
                        + ' expected but resolved with ' + result);
                    done();
                },
                msgWithParams => {
                    expect(msgWithParams).toEqual(expectedMsgWithParams);
                    done();
                }
            );
        };

        // create

        it('should create a document and create a resource.id',
            function (done) {

                datastore.create(doc('sd1'))
                    .then(
                        _createdDoc => {
                            const createdDoc = _createdDoc as Document;
                            expect(createdDoc.resource.id).not.toBe(undefined);
                            done();
                        },
                        () => {
                            fail();
                            done();
                        }
                    );
            }
        );

        it('should create a document and take the existing resource.id',
            function (done) {

                const docToCreate: Document = doc('sd1');
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
                        () => {
                            fail();
                            done();
                        }
                    );
            }
        );

        it('should not create a document with the resource.id of an alredy existing doc',
            function (done) {

                const docToCreate1: Document = doc('sd1');
                docToCreate1.resource.id = 'a1';
                const docToCreate2: Document = doc('sd1');
                docToCreate2.resource.id = 'a1';

                expectErr(()=>{return datastore.create(docToCreate1)
                        .then(() => datastore.create(docToCreate2))},
                    [M.DATASTORE_RESOURCE_ID_EXISTS],done);
            }
        );

        // update

        it('should update an existing document with no identifier conflict',
            function (done) {

                const doc2 = doc('id2');

                datastore.create(doc('id1'))
                    .then(() => datastore.create(doc2))
                    .then(() => {
                        return datastore.update(doc2);
                    }).then(
                    () => {
                        done();
                    },
                    () => {
                        fail();
                        done();
                    }
                );
            }
        );

        it('should not update if resource id not present',
            function (done) {

                datastore.update(doc('sd1')).then(
                    () => {
                        fail();
                        done();
                    },
                    expectedErr=>{
                        expect(expectedErr[0]).toBe(DatastoreErrors.DOCUMENT_NO_RESOURCE_ID);
                        done();
                    }
                );
            }
        );

        it('should not update if not existent',
            function (done) {

                datastore.update(doc('sd1','identifier1','object','id1')).then(
                    () => {
                        fail();
                        done();
                    },
                    expectedErr=>{
                        expect(expectedErr[0]).toBe(DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR);
                        done();
                    }
                );
            }
        );

        // get

        it('should get if existent',
            function (done) {
                const d = doc('sd1');
                datastore.create(d)
                    .then(() => datastore.get(d['resource']['id']))
                    .then(doc => {
                        expect(doc['resource']['shortDescription']).toBe('sd1');
                        done();
                    });

            }
        );

        it('should reject with keyOfM in when trying to get a non existing document',
            function (done) {
                expectErr(()=>{return datastore.create(doc('sd1'))
                        .then(() => datastore.get('nonexisting'))}
                    ,[M.DATASTORE_NOT_FOUND],done);
            }
        );

        // refresh

        it('should reject with keyOfM in when trying to refresh a non existing document',
            function (done) {

                const non = doc('sd2');
                expectErr(()=>{
                    return datastore.create(doc('id1'))
                        .then(() => datastore.refresh(non))},[M.DATASTORE_NOT_FOUND],done);
            }
        );

        // remove

        it('should remove if existent',
            function (done) {
                const d = doc('sd1');
                expectErr(()=>{
                    return datastore.create(d)
                        .then(() => datastore.remove(d))
                        .then(() => datastore.get(d['resource']['id']))
                    },
                    [M.DATASTORE_NOT_FOUND],done);

            }
        );

        it('should throw error when no resource id',
            function (done) {
                expectErr(()=>{return datastore.remove(doc('sd2'))}
                    ,[DatastoreErrors.DOCUMENT_NO_RESOURCE_ID],done);
            }
        );

        it('should throw error when trying to remove and not existent',
            function (done) {
                const d = doc('sd1');
                d['resource']['id'] = 'hoax';
                expectErr(()=>{return datastore.remove(d)}
                    ,[DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR],done);
            }
        );

        // find

        it('should find with filterSet undefined', function(done){
            const doc1 = doc('sd1','identifier1','object','id1');

            datastore.create(doc1)
                .then(() => datastore.findIds({q: 'sd1'}))
                .then(
                    result => {
                        expect(result[0]).toBe('id1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should not find with query undefined', function(done){
            const doc1 = doc('sd1');

            datastore.create(doc1)
                .then(() => datastore.findIds(undefined))
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
            const doc1 = doc('sd1','identifier1','object','id1');

            datastore.create(doc1)
                .then(() => datastore.findIds({q: undefined, prefix: true}))
                .then(
                    result => {
                        expect(result[0]).toBe('id1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should find with omitted q', function(done){
            const doc1 = doc('sd1','identifier1','object','id1');

            datastore.create(doc1)
                .then(() => datastore.findIds({prefix: true}))
                .then(
                    result => {
                        expect(result[0]).toBe('id1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should find with omitted q and ommitted prefix', function(done){
            const doc1 = doc('sd1','identifier1','object','id1');

            datastore.create(doc1)
                .then(() => datastore.findIds({}))
                .then(
                    result => {
                        expect(result[0]).toBe('id1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should match all fields', function(done){
            const doc1 = doc('bla','blub');
            const doc2 = doc('blub','bla');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.findIds({q: 'bla'}))
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

        it('should filter by one type in find', function(done){
            const doc1 = doc('bla1', 'blub', 'type1');
            const doc2 = doc('bla2', 'blub', 'type2');
            const doc3 = doc('bla3', 'blub', 'type3','id3');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds({q: 'blub', type: 'type3'}))
                .then(
                    result => {
                        expect(result.length).toBe(1);
                        expect(result[0]).toBe('id3');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter by parent type in find', function(done){
            const doc1 = doc('blub', 'bla1', 'type1');
            const doc2 = doc('blub', 'bla2', 'type2','id2');
            const doc3 = doc('blub', 'bla1.1', 'type1.1');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds({q: 'blub', type: 'type1'}))
                .then(result => {
                    expect(result.length).toBe(2);
                    expect(result[0]).not.toBe('id2');
                    expect(result[1]).not.toBe('id2');
                })
                .then(() => datastore.findIds({q: 'blub', type: 'root'}))
                .then(result => {
                        expect(result.length).toBe(3);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        }, 2000);

        it('should find by prefix query and filter', function(done) {
            const doc1 = doc('bla1', 'blub1', 'type1');
            const doc2 = doc('bla2', 'blub2', 'type2');
            const doc3 = doc('bla3', 'blub3', 'type2');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds({
                    q: 'blub',
                    type: 'type2',
                    prefix: true
                }))
                .then(
                    result => {
                        expect(result.length).toBe(2);
                        expect(result[0]).not.toBe('id1');
                        expect(result[1]).not.toBe('id1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter with constraint', function(done) {
            const doc1 = doc('bla1', 'blub1', 'type1','id1');

            const doc2 = doc('bla2', 'blub2', 'type2','id2');
            const doc3 = doc('bla3', 'blub3', 'type2','id3');
            const doc4 = doc('bla4', 'blub4', 'type2','id4');
            doc2.resource.relations['isRecordedIn'] = ['id1'];
            doc3.resource.relations['isRecordedIn'] = ['id1'];
            doc4.resource.relations['isRecordedIn'] = ['id2'];

            const q: Query = {
                q: 'blub',
                prefix: true,
                constraints: {
                    'resource.relations.isRecordedIn' : 'id1'
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.create(doc4))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results[0]).toBe('id2');
                        expect(results[1]).toBe('id3');
                        expect(results.length).toBe(2);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter with constraint undefined', function(done) {
            const doc1 = doc('bla1', 'blub1', 'type1','id1');
            const doc2 = doc('bla2', 'blub2', 'type2','id2');

            const doc3 = doc('bla3', 'blub3', 'type2','id3');
            doc3.resource.relations['isRecordedIn'] = ['id5'];

            const q: Query = {
                q: 'blub',
                prefix: true,
                constraints: {
                    'resource.relations.isRecordedIn' : undefined
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results[0]).toBe('id1');
                        expect(results[1]).toBe('id2');
                        expect(results.length).toBe(2);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter with multiple constraints', function(done) {
            const doc1 = doc('bla1', 'blub1', 'type1','id1');

            const doc2 = doc('bla2', 'blub2', 'type2','id2');
            doc2.resource.relations['isRecordedIn'] = ['id1'];
            const doc3 = doc('bla3', 'blub3', 'type2','id3');
            doc3.resource.relations['isRecordedIn'] = ['id1'];
            doc3.resource.relations['liesWithin'] = ['id2'];

            const q: Query = {
                q: 'blub',
                prefix: true,
                constraints: {
                    'resource.relations.isRecordedIn' : 'id1',
                    'resource.relations.liesWithin' : undefined
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results[0]).toBe('id2');
                        expect(results.length).toBe(1);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter with unknown constraint ', function(done) {
            const doc1 = doc('bla1', 'blub1', 'type1','id1');
            const doc2 = doc('bla2', 'blub2', 'type2','id2');

            const q: Query = {
                q: 'blub',
                prefix: true,
                constraints: {
                    'unknown' : 'id1',
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results[0]).toBe('id1');
                        expect(results[1]).toBe('id2');
                        expect(results.length).toBe(2);
                        expect(console.warn).toHaveBeenCalled();
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        it('should filter with one known and one unknown constraint ', function(done) {
            const doc1 = doc('bla1', 'blub1', 'type1','id1');
            const doc2 = doc('bla2', 'blub2', 'type2','id2');
            doc2.resource.relations['liesWithin'] = ['id1'];

            const q: Query = {
                q: 'blub',
                prefix: true,
                constraints: {
                    'unknown' : 'id1',
                    'resource.relations.liesWithin' : 'id1'
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results[0]).toBe('id2');
                        expect(results.length).toBe(1);
                        expect(console.warn).toHaveBeenCalled();
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });



        xit('should show all sorted by lastModified', function(done) {
            datastore.create(doc('bla1','blub1','type1'))
                // .then(() => new Promise(resolve => setTimeout(resolve, 100)))
                .then(() => datastore.create(doc('bla2', 'blub2', 'type2')))
                // .then(() => new Promise(resolve => setTimeout(resolve, 100)))
                .then(() => datastore.create(doc('bla3', 'blub3', 'type3')))
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
                        fail(err);
                        done();
                    }
                );
        }, 2000);

        // all

        xit('should filter by parent type in all', function(done) {
            const doc1 = doc('blub','bla1','type1');
            const doc2 = doc('blub','bla2','type2');
            const doc3 = doc('blub','bla1.1','type1.1');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.all('type1'))
                .then(
                    result => {
                        expect(result.length).toBe(2);
                        expect(result[0].resource['shortDescription']).not.toBe('bla2');
                        expect(result[0].resource.type).not.toBe('type2');
                        expect(result[1].resource['shortDescription']).not.toBe('bla2');
                        expect(result[1].resource.type).not.toBe('type2');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });

        // idai-field-datastore specific

        xit('should find conflicted documents sorted by lastModified', function(done) {

            let db1 = new PouchDB('testdb');
            let db2 = new PouchDB('testdb2');

            db1.put(doc('bluba', 'bla1', 'type1', '1'))
                .then(() => db2.put(doc('blubb', 'bla1', 'type1', '1')))
                .then(() => db1.put(doc('bluba', 'bla2', 'type2', '2')))
                .then(() => db2.put(doc('blubb', 'bla2', 'type2', '2')))
                .then(() => db1.put(doc('blub', 'bla1.1', 'type1.1', '3')))
                .then(() => new Promise(resolve => db2.replicate.to(db1).on('complete', resolve)))
                .then(() => datastore.findConflicted())
                .then(
                    result => {
                        expect(result.length).toBe(2);
                        expect(result[0].resource['identifier']).toBe('bla2');
                        expect(result[1].resource['identifier']).toBe('bla1');
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        }, 2000);

    });
}