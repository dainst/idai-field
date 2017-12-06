import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Static} from '../../static';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldDocumentConverter} from '../../../../app/core/datastore/idai-field-document-converter';
import {ImageTypeUtility} from '../../../../app/common/image-type-utility';
import {IdaiFieldImageDocumentDatastore} from '../../../../app/core/datastore/idai-field-image-document-datastore';
import {DocumentDatastore} from '../../../../app/core/datastore/document-datastore';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../../../../app/core/model/idai-field-image-document';

/**
 * This test suite focuses on the differences between the Data Access Objects.
 * They are designed to only deliver the right types of documents from the underlying
 * database. Also they make guarantees that the documents are well formed, so the
 * rest of the application can rely on it, which, together with the typescript
 * typing information, helps elimiate a lot of extra checks for otherwise possibly
 * missing properties elsewhere.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    const projectConfiguration = new ProjectConfiguration({
        'types': [
            {
                'type': 'Trench',
                'fields': []
            },
            {
                'type': 'Image',
                'fields': []
            }
        ]
    });


    describe('CachedDatastoreExtensions/Subsystem', () => {

        let converter;
        let documentCache;
        let image0;
        let trench0;
        let idaiFieldImageDocumentDatastore: IdaiFieldImageDocumentDatastore;
        let idaiFieldDocumentDatastore: IdaiFieldDocumentDatastore;
        let documentDatastore: DocumentDatastore;


        function failOnWrongErr(err) {

            if (!err) fail("Wrong Err - undefined");
            if (err.indexOf('Wrong') === -1) fail('Wrong Err' + err);
        }


        beforeEach(async done => {

            spyOn(console, 'debug'); // suppress console.debug
            spyOn(console, 'error'); // TODO remove

            const result = Static.createPouchdbDatastore('testdb');
            const datastore = result.datastore;
            documentCache = result.documentCache;
            converter = new IdaiFieldDocumentConverter(new ImageTypeUtility(projectConfiguration));

            image0 = Static.doc('Image','Image','Image','image0');
            trench0 = Static.doc('Trench','Trench','Trench','trench0');

            idaiFieldImageDocumentDatastore = new IdaiFieldImageDocumentDatastore(
                datastore, documentCache, converter);
            idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
                datastore, documentCache, converter);
            documentDatastore = new DocumentDatastore(
                datastore, documentCache, converter);

            await idaiFieldImageDocumentDatastore.create(image0);
            await idaiFieldDocumentDatastore.create(trench0);
            done();
        });


        afterEach(async done => {

            await new PouchDB('testdb').destroy();
            done();
        }, 5000);


        // create

        it('IdaiFieldDocumentDatastore - throw when creating an image type', async done => {

            try {
                await idaiFieldDocumentDatastore.create(image0);
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when creating a non image type', async done => {

            try {
                await idaiFieldImageDocumentDatastore.create(trench0);
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('create - add relations with IdaiFieldImageDocumentDatastore', async done => {

            try {
                expect((await idaiFieldImageDocumentDatastore.
                create(Static.doc('Image','Image','Image','image1'))).
                    resource.relations.depicts).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });


        it('create - add relations with IdaiFieldDocumentDatastore', async done => {

            try {
                expect((await idaiFieldDocumentDatastore.
                create(Static.doc('Trench','Trench','Trench','trench1'))).
                    resource.relations.isRecordedIn).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });


        // update

        it('IdaiFieldDocumentDatastore - throw when updating an image type', async done => {

            try {
                await idaiFieldDocumentDatastore.update(image0);
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when updating a non image type', async done => {

            try {
                await idaiFieldImageDocumentDatastore.update(trench0);
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        // remove

        it('IdaiFieldDocumentDatastore - throw when deleting an image type', async done => {

            try {
                await idaiFieldDocumentDatastore.remove(image0);
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when deleting a non image type', async done => {

            try {
                await idaiFieldImageDocumentDatastore.remove(trench0);
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        // get

        it('IdaiFieldDocumentDatastore - throw when getting an image type', async done => {

            try {
                await idaiFieldDocumentDatastore.get('image0', { skip_cache: true });
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when getting a non image type', async done => {

            try {
                await idaiFieldImageDocumentDatastore.get('trench0', { skip_cache: true });
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('get - add relations for IdaiFieldDocument', async done => {

            try {
                expect((await idaiFieldDocumentDatastore.get('trench0', { skip_cache: true })).
                    resource.relations.isRecordedIn).toEqual([]);
                expect((await idaiFieldDocumentDatastore.get('trench0', { skip_cache: false })).
                    resource.relations.isRecordedIn).toEqual([]);
                expect((await documentDatastore.get('trench0', { skip_cache: true })).
                    resource.relations.isRecordedIn).toEqual([]);
                expect((await documentDatastore.get('trench0', { skip_cache: false })).
                    resource.relations.isRecordedIn).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });


        it('get - add relations for IdaiFieldImageDocument', async done => {

            try {
                expect((await idaiFieldImageDocumentDatastore.get('image0', { skip_cache: true })).
                    resource.relations.depicts).toEqual([]);
                expect((await idaiFieldImageDocumentDatastore.get('image0', { skip_cache: false })).
                    resource.relations.depicts).toEqual([]);
                expect((await documentDatastore.get('image0', { skip_cache: true })).
                    resource.relations.depicts).toEqual([]);
                expect((await documentDatastore.get('image0', { skip_cache: false })).
                    resource.relations.depicts).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });


        // find

        it('IdaiFieldDocumentDatastore - throw when find called with image type ', async done => {

            try {
                await idaiFieldDocumentDatastore.find({types: ['Image']});
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when find called with non image type ', async done => {

            try {
                await idaiFieldImageDocumentDatastore.find({types: ['Trench']});
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('DocumentDatastore - do not throw and return everything with all types', async done => {

            try {
                const result = await documentDatastore.find({types: ['Trench', 'Image']});
                expect(result.documents.length).toBe(2);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('DocumentDatastore - return everything when called without types', async done => {

            try {
                const result = await documentDatastore.find({});
                expect(result.documents.length).toBe(2);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - return only image type documents when called without types', async done => {

            try {
                const result = await idaiFieldImageDocumentDatastore.find({});
                expect(result.documents.length).toBe(1);
                expect(result.documents[0].resource.id).toEqual('image0');
            } catch (expected) {
                fail();
            }
            done();
        });


        it('IdaiFieldDocumentDatastore - return only non image type documents when called without types', async done => {

            try {
                const result = await idaiFieldDocumentDatastore.find({});
                expect(result.documents.length).toBe(1);
                expect(result.documents[0].resource.id).toEqual('trench0');
            } catch (expected) {
                fail();
            }
            done();
        });


        it('find - add relations for IdaiFieldDocument', async done => {

            try {
                expect((await idaiFieldDocumentDatastore.find({})). // result coming from cache
                    documents[0].resource.relations.isRecordedIn).toEqual([]);
                expect((await idaiFieldImageDocumentDatastore.find({})). // result coming from cache
                    documents[0].resource.relations.depicts).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });
    });
}
