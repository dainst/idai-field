import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Static} from '../../static';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldDocumentConverter} from '../../../../app/core/datastore/idai-field-document-converter';
import {ImageTypeUtility} from '../../../../app/common/image-type-utility';
import {IdaiFieldImageDocumentDatastore} from '../../../../app/core/datastore/idai-field-image-document-datastore';

/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
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
                'type': 'Find',
                'fields': []
            },
            {
                'type': 'Image',
                'fields': []
            }
        ]
    });


    describe('CachedDatastoreExtensions/Subsystem', () => {

        let document1: Document;
        let document2: Document;
        let document3: Document;

        let datastore: any;
        let imageTypeUtility;
        let result;


        function failOnWrongErr(err) {

            if (err.indexOf('Wrong') === -1) fail('Wrong Err');
        }


        beforeEach(
            () => {
                spyOn(console, 'debug'); // suppress console.debug

                imageTypeUtility = new ImageTypeUtility(projectConfiguration);
                result = Static.createPouchdbDatastore('testdb');
            }
        );


        afterEach(async done => {

            new PouchDB('testdb').destroy().then(() => {done()})

        }, 5000);


        it('throw when creating an image type with IdaiFieldDocumentDatastore', async done => {

            datastore = new IdaiFieldDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.create(Static.doc('Img','Img','Image','img'));
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('throw when creating a non image type with IdaiFieldImageDocumentDatastore', async done => {

            datastore = new IdaiFieldImageDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.create(Static.doc('trench1','trench1','Trench','t1'));
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('throw when updating an image type with IdaiFieldDocumentDatastore', async done => {

            datastore = new IdaiFieldDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.update(Static.doc('Img','Img','Image','img'));
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('throw when updating a non image type with IdaiFieldImageDocumentDatastore', async done => {

            datastore = new IdaiFieldImageDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.update(Static.doc('trench1','trench1','Trench','t1'));
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('throw when deleting an image type with IdaiFieldDocumentDatastore', async done => {

            datastore = new IdaiFieldDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.remove(Static.doc('Img','Img','Image','img'));
                fail();
            } catch (expected) {
                await datastore.create(Static.doc('trench1','trench1','Trench','t1')); // to prevent closing db err
                failOnWrongErr(expected);
            }
            done();
        });


        it('throw when deleting a non image type with IdaiFieldImageDocumentDatastore', async done => {

            datastore = new IdaiFieldImageDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.remove(Static.doc('trench1','trench1','Trench','t1'));
                fail();
            } catch (expected) {
                await datastore.create(Static.doc('Img','Img','Image','img')); // to prevent closing db err
                failOnWrongErr(expected);
            }
            done();
        });


        it('throw when getting an image type with IdaiFieldDocumentDatastore', async done => {

            const ds2 = new IdaiFieldImageDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            await ds2.create(Static.doc('Img','Img','Image','img1'));

            datastore = new IdaiFieldDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.get('img1', { skip_cache: true });
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });


        it('throw when getting a non image type with IdaiFieldImageDocumentDatastore', async done => {

            const ds2 = new IdaiFieldDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            await ds2.create(Static.doc('trench1','trench1','Trench','t1'));

            datastore = new IdaiFieldImageDocumentDatastore(result.datastore, result.documentCache,
                new IdaiFieldDocumentConverter(imageTypeUtility));
            try {
                await datastore.get('t1', { skip_cache: true });
                fail();
            } catch (expected) {
                failOnWrongErr(expected);
            }
            done();
        });
    });
}
