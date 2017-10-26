import {Document} from 'idai-components-2/core';
import {IdaiFieldDatastore} from '../../../../app/core/datastore/idai-field-datastore';
import {DocumentCache} from '../../../../app/core/datastore/idai-field-document-cache';
import {PouchdbDatastore} from '../../../../app/core/datastore/pouchdb-datastore';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('IdaiFieldDatastore', () => {

        let datastore: IdaiFieldDatastore;
        let mockdb: any;
        let documentChangesNotificationsCallback;

        function doc(sd, identifier?): Document {

            return { resource: {
                    shortDescription: sd,
                    identifier: identifier,
                    title: 'title',
                    type: 'Find',
                    relations: {}
                }
            }
        }


        function verifyIsIdaiFieldDocument(document) {

            expect(document.resource.identifier).toEqual('');
            expect(document.resource.relations.isRecordedIn).toEqual([]);
        }


        beforeEach(() => {

            spyOn(console, 'debug'); // suppress console.debug

            mockdb = jasmine.createSpyObj('mockdb',
                    ['findIds', 'documentChangesNotifications', 'create', 'update', 'fetch', 'fetchRevision']);
                mockdb.update.and.callFake(function(dd){
                    // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
                    dd.resource.id = '1';
                    dd['_rev'] = '2';
                    return Promise.resolve(dd);
                });
                mockdb.findIds.and.callFake(function() {
                    const d = doc('sd1');
                    d.resource.id = '1';
                    return Promise.resolve(['1']);
                });
                mockdb.create.and.callFake(function(dd) {
                    // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
                    dd.resource.id = '1';
                    return Promise.resolve(dd);
                });
                // mockdb.documentChangesNotifications.and.callFake(function() {return {subscribe: function(){}}});
                mockdb.documentChangesNotifications.and.returnValues({subscribe: (cb) =>
                        documentChangesNotificationsCallback = cb}
                    );


                datastore = new IdaiFieldDatastore(mockdb, new DocumentCache());
            }
        );


        it('should add missing fields on get, bypassing cache', async (done) => {

            mockdb.fetch.and.returnValues(Promise.resolve({
                resource: {
                    id: '1',
                    relations: {}
                }
            }));

            const document = await datastore.get('1'); // fetch from mockdb
            verifyIsIdaiFieldDocument(document);
            done();
        });


        it('should add missing fields on getRevision (bypassing cache)', async (done) => {

            mockdb.fetchRevision.and.returnValues(Promise.resolve({
                resource: {
                    id: '1',
                    relations: {}
                }
            }));

            const document = await datastore.getRevision('1', '1'); // fetch from mockdb
            verifyIsIdaiFieldDocument(document);
            done();
        });


        it('should add missing fields on find, bypassing cache', async (done) => {

            mockdb.findIds.and.returnValues(Promise.resolve(['1']));
            mockdb.fetch.and.returnValues(Promise.resolve({
                resource: {
                    id: '1',
                    relations: {}
                }
            }));

            const documents = await datastore.find({}); // fetch from mockdb
            expect(documents.length).toBe(1);
            verifyIsIdaiFieldDocument(documents[0]);
            done();
        });


        it('should add missing fields on find', async (done) => {

            await datastore.create({resource: { // trigger caching of document
                id: '1',
                relations: {}
            }} as any);
            mockdb.findIds.and.returnValues(Promise.resolve(['1']));

            const documents = await datastore.find({}); // fetch from cache
            expect(documents.length).toBe(1);
            verifyIsIdaiFieldDocument(documents[0]);
            done();
        });


        it('should add missing fields on create', async (done) => {

            await datastore.create({resource: { // trigger caching of document
                id: '1',
                relations: {}
            }} as any);
            const document = await datastore.get('1'); // fetch from cache
            verifyIsIdaiFieldDocument(document);
            done();
        });


        it('should add missing fields on update', async (done) => {

            await datastore.update({resource: { // trigger caching of document
                id: '1',
                relations: {}
            }} as any);
            const document = await datastore.get('1'); // fetch from cache
            verifyIsIdaiFieldDocument(document);
            done();
        });


        it('should add missing fields on update with reassign', async (done) => {

            await datastore.update({resource: { // trigger caching of document
                id: '1',
                val: 'a',
                relations: {}
            }} as any);
            await datastore.update({resource: { // trigger caching and reassigning of document
                id: '1',
                val: 'b',
                relations: {}
            }} as any);
            const document = await datastore.get('1'); // fetch from cache
            expect(document.resource['val']).toEqual('b');
            verifyIsIdaiFieldDocument(document);
            done();
        });


        it('should add missing fields on documentChangesNotifications with reassign', async (done) => {

            await datastore.create({resource: { // trigger caching of document
                id: '1',
                val: 'a',
                relations: {}
            }} as any);
            documentChangesNotificationsCallback(
                {type: 'changed', document: {resource: { // trigger reassigning of document
                    id: '1',
                    val: 'b',
                    relations: {}
                }}} as any);

            const document = await datastore.get('1'); // fetch from cache
            expect(document.resource['val']).toEqual('b');
            verifyIsIdaiFieldDocument(document);
            done();
        });


        it('should return the cached instance on create', async (done) => {

            let doc1 = doc('sd1', 'identifier1');

            await datastore.create(doc1);
            try {
                const result = await datastore.find({q: 'sd1'}); // mockdb returns other instance
                expect((result[0] as Document).resource['identifier']).toBe('identifier1');
                doc1.resource['shortDescription'] = 's4';
                expect((result[0] as Document).resource['shortDescription']).toBe('s4');
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });


        xit('should return cached instance on update', done => {

            let doc1 = doc('sd1', 'identifier1');
            let doc2;

            datastore.create(doc1)
               .then(() => {
                    doc2 = doc('sd1', 'identifier_');
                    doc2.resource.id = '1';
                    return datastore.update(doc2);
               })
               .then(() => datastore.find({q: 'sd1'})) // mockdb returns other instance
               .then(result => {
                   expect((result[0] as Document)['_rev']).toBe('2');
                   expect((result[0] as Document).resource['identifier']).toBe('identifier_');
                   doc2.resource['shortDescription'] = 's4';
                   expect((result[0] as Document).resource['shortDescription']).toBe('s4');
                   done();
               }).catch(err => {
               fail(err);
               done();
            });
        });
    });
}