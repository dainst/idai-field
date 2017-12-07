import {Static} from '../../static';
import {DAOsSpecHelper} from './daos-spec-helper';

/**
 * This test suite focuses on the differences between the Data Access Objects.
 *
 * Depending of the Type Class T and based on document.resource.type,
 * it is to be guaranteed that only documents of the right types can be
 * accessed with the corresponding DAOs.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('DAOs/Access/Subsystem', () => {

        let image0;
        let trench0;
        let h;

        function expectErr1(err) {

            if (!err) fail("Wrong Err - undefined");
            if (err.indexOf('Wrong') === -1) fail('Wrong Err' + err);
        }


        beforeEach(async done => {

            h = new DAOsSpecHelper();

            spyOn(console, 'error'); // TODO remove

            const result = Static.createPouchdbDatastore('testdb');
            const datastore = result.datastore;

            image0 = Static.doc('Image','Image','Image','image0');
            trench0 = Static.doc('Trench','Trench','Trench','trench0');

            await h.idaiFieldImageDocumentDatastore.create(image0);
            await h.idaiFieldDocumentDatastore.create(trench0);
            done();
        });


        afterEach(async done => {

            await new PouchDB('testdb').destroy();
            done();
        }, 5000);


        // create

        it('IdaiFieldDocumentDatastore - throw when creating an image type', async done => {

            try {
                await h.idaiFieldDocumentDatastore.create(image0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when creating a non image type', async done => {

            try {
                await h.idaiFieldImageDocumentDatastore.create(trench0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // update

        it('IdaiFieldDocumentDatastore - throw when updating an image type', async done => {

            try {
                await h.idaiFieldDocumentDatastore.update(image0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when updating a non image type', async done => {

            try {
                await h.idaiFieldImageDocumentDatastore.update(trench0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // remove

        it('IdaiFieldDocumentDatastore - throw when deleting an image type', async done => {

            try {
                await h.idaiFieldDocumentDatastore.remove(image0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when deleting a non image type', async done => {

            try {
                await h.idaiFieldImageDocumentDatastore.remove(trench0);
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // get

        it('IdaiFieldDocumentDatastore - throw when getting an image type', async done => {

            try {
                await h.idaiFieldDocumentDatastore.get('image0', { skip_cache: true });
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when getting a non image type', async done => {

            try {
                await h.idaiFieldImageDocumentDatastore.get('trench0', { skip_cache: true });
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        // find

        it('IdaiFieldDocumentDatastore - throw when find called with image type ', async done => {

            try {
                await h.idaiFieldDocumentDatastore.find({types: ['Image']});
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - throw when find called with non image type ', async done => {

            try {
                await h.idaiFieldImageDocumentDatastore.find({types: ['Trench']});
                fail();
            } catch (expected) {
                expectErr1(expected);
            }
            done();
        });


        it('DocumentDatastore - do not throw and return everything with all types', async done => {

            try {
                const result = await h.documentDatastore.find({types: ['Trench', 'Image']});
                expect(result.documents.length).toBe(2);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('DocumentDatastore - return everything when called without types', async done => {

            try {
                const result = await h.documentDatastore.find({});
                expect(result.documents.length).toBe(2);
            } catch (err) {
                fail(err);
            }
            done();
        });


        it('IdaiFieldImageDocumentDatastore - return only image type documents when called without types', async done => {

            try {
                const result = await h.idaiFieldImageDocumentDatastore.find({});
                expect(result.documents.length).toBe(1);
                expect(result.documents[0].resource.id).toEqual('image0');
            } catch (expected) {
                fail();
            }
            done();
        });


        it('IdaiFieldDocumentDatastore - return only non image type documents when called without types', async done => {

            try {
                const result = await h.idaiFieldDocumentDatastore.find({});
                expect(result.documents.length).toBe(1);
                expect(result.documents[0].resource.id).toEqual('trench0');
            } catch (expected) {
                fail();
            }
            done();
        });
    });
}
