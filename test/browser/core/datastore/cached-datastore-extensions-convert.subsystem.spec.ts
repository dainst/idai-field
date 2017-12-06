import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Static} from '../../static';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../../../app/core/datastore/idai-field-type-converter';
import {ImageTypeUtility} from '../../../../app/common/image-type-utility';
import {IdaiFieldImageDocumentDatastore} from '../../../../app/core/datastore/idai-field-image-document-datastore';
import {DocumentDatastore} from '../../../../app/core/datastore/document-datastore';
import {C} from './c';

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


    describe('CachedDatastoreExtensions/Convert/Subsystem', () => {

        let image0;
        let trench0;
        let c;


        function expectErr(err) {

            if (!err) fail("Wrong Err - undefined");
            if (err.indexOf('Unknown type') === -1) fail('Wrong Err' + err);
        }


        beforeEach(async done => {

            c = new C();

            spyOn(console, 'error'); // TODO remove

            image0 = Static.doc('Image','Image','Image','image0');
            trench0 = Static.doc('Trench','Trench','Trench','trench0');

            await c.idaiFieldImageDocumentDatastore.create(image0);
            await c.idaiFieldDocumentDatastore.create(trench0);
            done();
        });


        afterEach(async done => {

            await new PouchDB('testdb').destroy();
            done();
        }, 5000);


        // create

        it('create - add relations with IdaiFieldImageDocumentDatastore', async done => {

            try {
                expect((await c.idaiFieldImageDocumentDatastore.
                create(Static.doc('Image','Image','Image','image1'))).
                    resource.relations.depicts).toEqual([]);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('create - add relations with IdaiFieldDocumentDatastore', async done => {

            try {
                expect((await c.idaiFieldDocumentDatastore.
                create(Static.doc('Trench','Trench','Trench','trench1'))).
                    resource.relations.isRecordedIn).toEqual([]);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('create - unknown type', async done => {

            try {
                expect((await c.idaiFieldDocumentDatastore.
                create(Static.doc('Trench','Trench','Unknown','trench1'))).
                    resource.relations.isRecordedIn).toEqual([]);
                fail();
            } catch (err) {
                expectErr(err);
            }
            done();
        });


        // update

        it('update - add relations with IdaiFieldImageDocumentDatastore', async done => {

            try {
                delete image0.resource.relations.depicts;
                expect((await c.idaiFieldImageDocumentDatastore.
                update(image0)).resource.relations.depicts).toEqual([]);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('update - add relations with IdaiFieldDocumentDatastore', async done => {

            try {
                delete trench0.resource.relations.isRecordedIn;
                expect((await c.idaiFieldDocumentDatastore.
                update(trench0)).resource.relations.isRecordedIn).toEqual([]);
            } catch (err) {
                fail(err);
            }
            done();
        });


        // get

        it('get - add relations for IdaiFieldDocument', async done => {

            try {
                expect((await c.idaiFieldDocumentDatastore.get('trench0', { skip_cache: true })).
                    resource.relations.isRecordedIn).toEqual([]);
                expect((await c.idaiFieldDocumentDatastore.get('trench0', { skip_cache: false })).
                    resource.relations.isRecordedIn).toEqual([]);
                expect((await c.documentDatastore.get('trench0', { skip_cache: true })).
                    resource.relations.isRecordedIn).toEqual([]);
                expect((await c.documentDatastore.get('trench0', { skip_cache: false })).
                    resource.relations.isRecordedIn).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });


        it('get - add relations for IdaiFieldImageDocument', async done => {

            try {
                expect((await c.idaiFieldImageDocumentDatastore.get('image0', { skip_cache: true })).
                    resource.relations.depicts).toEqual([]);
                expect((await c.idaiFieldImageDocumentDatastore.get('image0', { skip_cache: false })).
                    resource.relations.depicts).toEqual([]);
                expect((await c.documentDatastore.get('image0', { skip_cache: true })).
                    resource.relations.depicts).toEqual([]);
                expect((await c.documentDatastore.get('image0', { skip_cache: false })).
                    resource.relations.depicts).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });


        // find

        it('find - add relations for IdaiFieldDocument', async done => {

            try {
                expect((await c.idaiFieldDocumentDatastore.find({})). // result coming from cache
                    documents[0].resource.relations.isRecordedIn).toEqual([]);
                expect((await c.idaiFieldImageDocumentDatastore.find({})). // result coming from cache
                    documents[0].resource.relations.depicts).toEqual([]);
            } catch (err) {
                fail();
            }
            done();
        });
    });
}
