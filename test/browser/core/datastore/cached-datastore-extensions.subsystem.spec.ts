import {Static} from '../../static';
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

    describe('CachedDatastoreExtensions/Subsystem', () => {

        let image0;
        let trench0;
        let c;

        function expectErr1(err) {

            if (!err) fail("Wrong Err - undefined");
            if (err.indexOf('Wrong') === -1) fail('Wrong Err' + err);
        }


        beforeEach(async done => {

            c = new C();

            spyOn(console, 'error'); // TODO remove

            const result = Static.createPouchdbDatastore('testdb');
            const datastore = result.datastore;

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

        it('IdaiFieldDocumentDatastore - throw when creating an image type', async done => {

            try {
                await c.idaiFieldDocumentDatastore.create(image0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when creating a non image type', async done => {

            try {
                await c.idaiFieldImageDocumentDatastore.create(trench0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // update

        it('IdaiFieldDocumentDatastore - throw when updating an image type', async done => {

            try {
                await c.idaiFieldDocumentDatastore.update(image0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when updating a non image type', async done => {

            try {
                await c.idaiFieldImageDocumentDatastore.update(trench0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // remove

        it('IdaiFieldDocumentDatastore - throw when deleting an image type', async done => {

            try {
                await c.idaiFieldDocumentDatastore.remove(image0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when deleting a non image type', async done => {

            try {
                await c.idaiFieldImageDocumentDatastore.remove(trench0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // get

        it('IdaiFieldDocumentDatastore - throw when getting an image type', async done => {

            try {
                await c.idaiFieldDocumentDatastore.get('image0', { skip_cache: true });
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when getting a non image type', async done => {

            try {
                await c.idaiFieldImageDocumentDatastore.get('trench0', { skip_cache: true });
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // find

        it('IdaiFieldDocumentDatastore - throw when find called with image type ', async done => {

            try {
                await c.idaiFieldDocumentDatastore.find({types: ['Image']});
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when find called with non image type ', async done => {

            try {
                await c.idaiFieldImageDocumentDatastore.find({types: ['Trench']});
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('DocumentDatastore - do not throw and return everything with all types', async done => {

            try {
                const result = await c.documentDatastore.find({types: ['Trench', 'Image']});
                expect(result.documents.length).toBe(2);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('DocumentDatastore - return everything when called without types', async done => {

            try {
                const result = await c.documentDatastore.find({});
                expect(result.documents.length).toBe(2);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - return only image type documents when called without types', async done => {

            try {
                const result = await c.idaiFieldImageDocumentDatastore.find({});
                expect(result.documents.length).toBe(1);
                expect(result.documents[0].resource.id).toEqual('image0');
            } catch (expected) {
                fail();
            }
            done();
        });


        it('IdaiFieldDocumentDatastore - return only non image type documents when called without types', async done => {

            try {
                const result = await c.idaiFieldDocumentDatastore.find({});
                expect(result.documents.length).toBe(1);
                expect(result.documents[0].resource.id).toEqual('trench0');
            } catch (expected) {
                fail();
            }
            done();
        });
    });
}
