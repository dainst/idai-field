import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {CachedDatastore} from '../../../../app/core/datastore/core/cached-datastore';
import {DocumentCache} from '../../../../app/core/datastore/core/document-cache';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../../../app/core/datastore/idai-field-type-converter';


/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('CachedDatastore', () => {

        let datastore: IdaiFieldDocumentDatastore;
        let mockdb: any;
        let remoteChangesNotificationsCallback;

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
                    ['findIds', 'remoteChangesNotifications', 'create', 'update', 'fetch', 'fetchRevision']);

            mockdb.update.and.callFake(function(dd) {
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
            // mockdb.remoteChangesNotifications.and.callFake(function() {return {subscribe: function(){}}});
            mockdb.remoteChangesNotifications.and.returnValues({subscribe: (cb) =>
                    remoteChangesNotificationsCallback = cb}
                );

            const mockImageTypeUtility = jasmine.createSpyObj('mockImageTypeUtility',
                ['isImageType', 'validate', 'getNonImageTypeNames']);
            mockImageTypeUtility.isImageType.and.returnValue(false);
            mockImageTypeUtility.getNonImageTypeNames.and.returnValue(['Find']);

            datastore = new IdaiFieldDocumentDatastore(
                mockdb,
                new DocumentCache<IdaiFieldDocument>(),
                new IdaiFieldTypeConverter(mockImageTypeUtility));
        });


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

            const documents = (await datastore.find({})).documents; // fetch from mockdb
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

            const documents = (await datastore.find({})).documents; // fetch from cache
            expect(documents.length).toBe(1);
            verifyIsIdaiFieldDocument(documents[0]);
            done();
        });


        it('should limit the number of documents returned on find', async (done) => {

            await datastore.create({resource: {
                id: '1',
                relations: {}
            }} as any);

            await datastore.create({resource: {
                id: '2',
                relations: {}
            }} as any);

            mockdb.findIds.and.returnValues(Promise.resolve(['1', '2']));

            const { documents, totalCount } = await datastore.find({ 'limit': 1 });
            expect(documents.length).toBe(1);
            expect(totalCount).toBe(2);
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


        it('should add missing fields on remoteChangesNotifications with reassign', async (done) => {

            await datastore.create({resource: { // trigger caching of document
                id: '1',
                val: 'a',
                relations: {}
            }} as any);
            remoteChangesNotificationsCallback(
                {resource: { // trigger reassigning of document
                    id: '1',
                    val: 'b',
                    relations: {}
                }} as any);

            const document = await datastore.get('1'); // fetch from cache
            expect(document.resource['val']).toEqual('b');
            verifyIsIdaiFieldDocument(document);
            done();
        });


        it('should return the cached instance on create', async (done) => {

            let doc1 = doc('sd1', 'identifier1');

            await datastore.create(doc1);
            try {
                const documents = (await datastore.find({ q: 'sd1' })).documents; // mockdb returns other instance
                expect((documents[0]).resource['identifier']).toBe('identifier1');
                doc1.resource['shortDescription'] = 's4';
                expect((documents[0]).resource['shortDescription']).toBe('s4');
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
                   expect((result.documents[0])['_rev']).toBe('2');
                   expect((result.documents[0]).resource['identifier']).toBe('identifier_');
                   doc2.resource['shortDescription'] = 's4';
                   expect((result.documents[0]).resource['shortDescription']).toBe('s4');
                   done();
               }).catch(err => {
               fail(err);
               done();
            });
        });
    });
}