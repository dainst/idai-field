import {Document} from 'idai-components-2/core';
import {DatastoreErrors} from 'idai-components-2/datastore';
import {PouchdbDatastore} from '../../../../app/core/datastore/core/pouchdb-datastore';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export function main() {

    describe('PouchdbDatastore', () => {

        let datastore: PouchdbDatastore;

        
        beforeEach(() => {
            spyOn(console, 'debug'); // to suppress console.debug output
            spyOn(console, 'error'); // to suppress console.error output
            spyOn(console, 'warn');

            let result = Static.createPouchdbDatastore('testdb');
            datastore = result.datastore;
        });

        
        afterEach(async done => {

            await new PouchDB('testdb').destroy();
            await new PouchDB('testdb2').destroy();
            done();
        }, 5000);
        

        const expectErr = function(promise, expectedMsgWithParams, done) {

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

        it('should create a document and create a resource.id', async done => {

            try {
                const createdDoc = await datastore.create(Static.doc('sd1')) as Document;
                expect(createdDoc.resource.id).not.toBe(undefined);
            } catch (e) {
                fail(e);
            }
            done();
        });

        
        it('should create a document and take the existing resource.id', async done => {

            const docToCreate: Document = Static.doc('sd1');
            docToCreate.resource.id = 'a1';

            await datastore.create(docToCreate);
            // this step was added to adress a problem where a document
            // with an existing resource.id was stored but could not
            // get refreshed later
            await datastore.fetch(docToCreate.resource.id);
            // and the same may occur on get
            try {
                const createdDoc = await datastore.fetch(docToCreate.resource.id) as Document;
                expect(createdDoc.resource.id).toBe('a1');
            } catch (e) {
                fail(e);
            }
            done();
        });
        

        it('should not create a document with the resource.id of an alredy existing doc', done => {

            const docToCreate1: Document = Static.doc('sd1');
            docToCreate1.resource.id = 'a1';
            const docToCreate2: Document = Static.doc('sd1');
            docToCreate2.resource.id = 'a1';

            expectErr(()=>{return datastore.create(docToCreate1)
                    .then(() => datastore.create(docToCreate2))
                }, [DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS],done);
        });


        it('should not create if created not present', async done => {

            const doc = Static.doc('sd1');
            delete doc.created;

            try {
                await datastore.create(doc);
                fail();
            } catch (expected) {
                expect(expected[0]).toBe(DatastoreErrors.INVALID_DOCUMENT);
            }
            done();
        });

        // update

        it('should update an existing document with no identifier conflict', async done => {

            const doc2 = Static.doc('id2');

            await datastore.create(Static.doc('id1'));
            await datastore.create(doc2);
            try {
                await datastore.update(doc2);
            } catch (e) {
                fail(e);
            }
            done();
        });
        

        it('should not update if resource id not present', async done => {

            try {
                await datastore.update(Static.doc('sd1'));
                fail();
            } catch (expected) {
                expect(expected[0]).toBe(DatastoreErrors.INVALID_DOCUMENT);
            }
            done();
        });


        it('should not update if not existent', done => {

            datastore.update(Static.doc('sd1', 'identifier1', 'Find', 'id1')).then(
                () => {
                    fail();
                    done();
                },
                expectedErr => {
                    expect(expectedErr[0]).toBe(DatastoreErrors.DOCUMENT_NOT_FOUND);
                    done();
                }
            );
        });
        

        // get

        it('should get if existent', done => {

            const d = Static.doc('sd1');
            datastore.create(d)
                .then(() => datastore.fetch(d['resource']['id']))
                .then(doc => {
                    expect(doc['resource']['shortDescription']).toBe('sd1');
                    done();
                });
        });
        

        it('should reject with keyOfM in when trying to get a non existing document',
            done => {

            expectErr(() => {
                return datastore.create(Static.doc('sd1'))
                    .then(() => datastore.fetch('nonexisting'))
                }, [DatastoreErrors.DOCUMENT_NOT_FOUND], done);
        });

        
        // refresh

        it('should reject with keyOfM in when trying to refresh a non existing document',
            done => {

            expectErr(() => {
                return datastore.create(Static.doc('id1'))
                    .then(() => datastore.fetch('nonexistingid'))
                }, [DatastoreErrors.DOCUMENT_NOT_FOUND],done);
        });
        

        // remove

        it('should remove if existent', done => {

            const d = Static.doc('sd1');
            expectErr(() => {
                return datastore.create(d)
                    .then(() => datastore.remove(d))
                    .then(() => datastore.fetch(d['resource']['id']))
            }, [DatastoreErrors.DOCUMENT_NOT_FOUND], done);
        });
        

        it('should throw error when no resource id', done => {

            expectErr(() => { return datastore.remove(Static.doc('sd2')) },
                [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID], done);
        });
        

        it('should throw error when trying to remove and not existent', done => {

            const d = Static.doc('sd1');
            d['resource']['id'] = 'hoax';
            expectErr(() => { return datastore.remove(d)}, [DatastoreErrors.DOCUMENT_NOT_FOUND], done);

        });
    });
}