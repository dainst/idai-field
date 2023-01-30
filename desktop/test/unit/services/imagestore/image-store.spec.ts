const fs = require('fs');

import { ImageStore, ImageVariant } from 'idai-field-core';
import { FsAdapter } from '../../../../src/app/services/imagestore/fs-adapter';
import { ThumbnailGenerator } from '../../../../src/app/services/imagestore/thumbnail-generator';



/**
 * Test the interactions of desktop class implementations required by {@link ImageStore}.
 */

describe('Imagestore', () => {

    const mockImage: Buffer = fs.readFileSync( process.cwd() + '/test/test-data/logo.png');
    const testFilePath = process.cwd() + '/test/test-temp/imagestore/';
    const testProjectIdentifier = 'test_tmp_project';

    let imageStore: ImageStore;

    beforeAll(async done => {
        imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());
        await imageStore.init(testFilePath, testProjectIdentifier);

        done();
    });


    afterAll(async (done) => {
        fs.rmSync(testFilePath, { recursive: true });
        done();
    });


    it('should be able to create a file', async (done) => {

        await imageStore.store('test_create', mockImage);
        const expectedPath = testFilePath + testProjectIdentifier + '/test_create';
        fs.readFile(expectedPath, (err, data) => {
            if (err) fail(err);
            expect(data).toEqual(mockImage);
            done();
        });
    });


    it('should be able to read a file', async (done) => {

        await imageStore.store('test_read', mockImage);

        const readFile = await imageStore.getData('test_read', ImageVariant.ORIGINAL);

        expect(readFile).toEqual(mockImage);
        done();
    });


    it('should be able to remove a file', async (done) => {

        await imageStore.store('test_remove', mockImage);

        const readFile = await imageStore.getData('test_remove', ImageVariant.ORIGINAL);

        expect(readFile).toEqual(mockImage);

        await imageStore.remove('test_remove');

        const expectedPath = testFilePath + testProjectIdentifier + '/test_remove';

        try {
            fs.readFileSync(expectedPath);
            fail('Image should have been deleted and fs should throw exception.');
        } catch (e) {
        }

        const expectedThumbnailPath = testFilePath + testProjectIdentifier + '/thumbs/test_remove';

        try {
            fs.readFileSync(expectedThumbnailPath);
            fail('Image thumbnail should have been deleted and fs should throw exception.');
        } catch (e) {
        }

        const expectTombstone = testFilePath + testProjectIdentifier + '/test_remove.deleted';

        try{
            fs.readFileSync(expectTombstone);
        } catch (e) {
            console.error(e);
            fail('Image tombstone not found.');
        }

        const expectThumbnailTombstone = testFilePath + testProjectIdentifier + '/thumbs/test_remove.deleted';

        try{
            fs.readFileSync(expectThumbnailTombstone);
        } catch (e) {
            console.error(e);
            fail('Image thumbnail tombstone not found.');
        }

        done();
    });
});
