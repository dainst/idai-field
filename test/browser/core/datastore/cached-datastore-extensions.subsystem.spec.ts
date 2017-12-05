import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Static} from '../../static';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldDocumentConverter} from '../../../../app/core/datastore/idai-field-document-converter';
import {ImageTypeUtility} from '../../../../app/common/image-type-utility';
import {IdaiFieldImageDocumentDatastore} from '../../../../app/core/datastore/idai-field-image-document-datastore';

/**
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
        let idaiFieldImageDocumentDatastore;
        let idaiFieldDocumentDatastore;


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

            await idaiFieldImageDocumentDatastore.create(image0);
            await idaiFieldDocumentDatastore.create(trench0);
            done();
        });


        afterEach(async done => {

            await new PouchDB('testdb').destroy();
            done();
        }, 5000);


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


        // ----------------

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
    });
}
