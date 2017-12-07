import {Document} from 'idai-components-2/core';
import {DatastoreErrors, Query} from 'idai-components-2/datastore';
import {PouchdbDatastore} from '../../../../app/core/datastore/core/pouchdb-datastore';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export function main() {

    describe('PouchdbDatastore/Find', () => {

        let datastore: PouchdbDatastore;


        beforeEach(() => {
            spyOn(console, 'debug'); // to suppress console.debug output
            spyOn(console, 'error'); // to suppress console.error output
            spyOn(console, 'warn');

            let result = Static.createPouchdbDatastore('testdb');
            datastore = result.datastore;
        });


        afterEach(done => {

            new PouchDB('testdb').destroy()
                .then(() => new PouchDB('testdb2').destroy())
                .then(() => done());
        }, 5000);


        it('should find with filterSet undefined', done => {

            const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');

            datastore.create(doc1)
                .then(() => datastore.findIds({q: 'identifier'}))
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


        it('should not find with query undefined', done => {

            const doc1 = Static.doc('sd1');

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


        it('should find with prefix query undefined', done => {

            const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');

            datastore.create(doc1)
                .then(() => datastore.findIds({q: undefined}))
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


        it('should find with omitted q', done => {

            const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');

            datastore.create(doc1)
                .then(() => datastore.findIds({ }))
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


        it('should find with omitted q and ommitted prefix', done => {

            const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');

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


        it('should match all fields', done => {

            const doc1 = Static.doc('bla', 'blub');
            const doc2 = Static.doc('blub', 'bla');

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


        it('should filter by one type in find', done => {

            const doc1 = Static.doc('bla1', 'blub', 'type1');
            const doc2 = Static.doc('bla2', 'blub', 'type2');
            const doc3 = Static.doc('bla3', 'blub', 'type3', 'id3');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds({q: 'blub', types: ['type3']}))
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


        it('should find by prefix query and filter', done => {

            const doc1 = Static.doc('bla1', 'blub1', 'type1');
            const doc2 = Static.doc('bla2', 'blub2', 'type2');
            const doc3 = Static.doc('bla3', 'blub3', 'type2');

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds({
                    q: 'blub',
                    types: ['type2']
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


        it('should filter with constraint', done => {

            const doc1 = Static.doc('bla1', 'blub1', 'type1','id1');

            const doc2 = Static.doc('bla2', 'blub2', 'type2','id2');
            const doc3 = Static.doc('bla3', 'blub3', 'type2','id3');
            const doc4 = Static.doc('bla4', 'blub4', 'type2','id4');
            doc2.resource.relations['isRecordedIn'] = ['id1'];
            doc3.resource.relations['isRecordedIn'] = ['id1'];
            doc4.resource.relations['isRecordedIn'] = ['id2'];

            const q: Query = {
                q: 'blub',
                constraints: {
                    'isRecordedIn:contain' : 'id1'
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.create(doc4))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results).toContain('id2');
                        expect(results).toContain('id3');
                        expect(results.length).toBe(2);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });


        it('should filter with multiple constraints', done => {

            const doc1 = Static.doc('bla1', 'blub1', 'type1','id1');

            const doc2 = Static.doc('bla2', 'blub2', 'type2','id2');
            doc2.resource.relations['isRecordedIn'] = ['id1'];
            const doc3 = Static.doc('bla3', 'blub3', 'type2','id3');
            doc3.resource.relations['isRecordedIn'] = ['id1'];
            doc3.resource.relations['liesWithin'] = ['id2'];

            const q: Query = {
                q: 'blub',
                constraints: {
                    'isRecordedIn:contain' : 'id1',
                    'liesWithin:contain' : 'id2'
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results[0]).toBe('id3');
                        expect(results.length).toBe(1);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });


        it('should filter with a subtract constraint', done => {

            const doc1 = Static.doc('Document 1', 'doc1', 'type1','id1');
            const doc2 = Static.doc('Document 2', 'doc2', 'type1','id2');
            const doc3 = Static.doc('Document 3', 'doc3', 'type2','id3');
            doc3.resource.relations['isRecordedIn'] = ['id1'];
            const doc4 = Static.doc('Document 4', 'doc4', 'type2','id4');
            doc4.resource.relations['isRecordedIn'] = ['id2'];

            const q: Query = {
                q: 'doc',
                constraints: {
                    'isRecordedIn:contain' : { value: 'id2', type: 'subtract' }
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.create(doc3))
                .then(() => datastore.create(doc4))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results.length).toBe(3);
                        expect(results).toEqual(['id1', 'id2', 'id3']);
                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
        });


        it('should filter with unknown constraint', done => {

            const doc1 = Static.doc('bla1', 'blub1', 'type1','id1');
            const doc2 = Static.doc('bla2', 'blub2', 'type2','id2');

            const q: Query = {
                q: 'blub',
                constraints: {
                    'unknown' : 'id1',
                }
            };

            datastore.create(doc1)
                .then(() => datastore.create(doc2))
                .then(() => datastore.findIds(q))
                .then(
                    results => {
                        expect(results).toContain('id1');
                        expect(results).toContain('id2');
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


        it('should filter with one known and one unknown constraint ', done => {

            const doc1 = Static.doc('bla1', 'blub1', 'type1','id1');
            const doc2 = Static.doc('bla2', 'blub2', 'type2','id2');
            doc2.resource.relations['liesWithin'] = ['id1'];

            const q: Query = {
                q: 'blub',
                constraints: {
                    'unknown' : 'id1',
                    'liesWithin:contain' : 'id1'
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


        it('should sort by last modified descending', done => {

            const doc1 = Static.doc('bla1', 'blub1', 'type1','id1');
            const doc3 = Static.doc('bla3', 'blub3', 'type3','id3');
            doc3.resource.relations['isRecordedIn'] = ['id1'];

            setTimeout(()=>{

                const doc2 = Static.doc('bla2', 'blub2', 'type2','id2');
                doc2.resource.relations['isRecordedIn'] = ['id1'];

                const q: Query = {
                    q: 'blub',
                    constraints: {
                        'isRecordedIn:contain' : 'id1'
                    }
                };

                datastore.create(doc1)
                    .then(() => datastore.create(doc2))
                    .then(() => datastore.create(doc3))
                    .then(() => datastore.findIds(q))
                    .then(
                        results => {
                            expect(results.length).toBe(2);
                            expect(results[0]).toBe('id2');
                            expect(results[1]).toBe('id3');
                            done();
                        },
                        err => {
                            fail(err);
                            done();
                        }
                    );

            },100)
        });


        // TODO remove or rewrite
        xit('should find conflicted documents sorted by lastModified', done => {

            let db1 = new PouchDB('testdb');
            let db2 = new PouchDB('testdb2');

            db1.put(Static.doc('bluba', 'bla1', 'type1', '1'))
                .then(() => db2.put(Static.doc('blubb', 'bla1', 'type1', '1')))
                .then(() => db1.put(Static.doc('bluba', 'bla2', 'type2', '2')))
                .then(() => db2.put(Static.doc('blubb', 'bla2', 'type2', '2')))
                .then(() => db1.put(Static.doc('blub', 'bla1.1', 'type1.1', '3')))
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