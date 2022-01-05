const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');

import { ImageStore, ImageVariant } from 'idai-field-core';
import { FsAdapter } from '../../../../../src/app/services/imagestore/fs-adapter';
import { ThumbnailGenerator } from '../../../../../src/app/services/imagestore/thumbnail-generator';


describe('Imagestore', () => {

    const mockImage: Buffer = fs.readFileSync( process.cwd() + '/test/test-data/logo.png');
    const testFilePath = process.cwd() + '/test/test-temp/imagestore/';
    const testProjectName = 'test_tmp_project';

    let imageStore: ImageStore;

    beforeAll(async done => {
        imageStore = new ImageStore(new FsAdapter(undefined), new ThumbnailGenerator());
        imageStore.init(testFilePath, testProjectName);

        done();
    });


    afterAll(async (done) => {
        fs.rmSync(testFilePath, { recursive: true });
        done();
    });


    it('should create a file', (done) => {

        imageStore.store('test_create', mockImage);
        const expectedPath = testFilePath + testProjectName + '/test_create';
        fs.readFile(expectedPath, (err, data) => {
            if (err) fail(err);
            expect(data).toEqual(mockImage);
            done();
        });
    });


    it('should read a file', async (done) => {

        imageStore.store('test_read', mockImage);

        const readFile = await imageStore.getData('test_read', ImageVariant.ORIGINAL);

        expect(readFile).toEqual(mockImage);
        done();
    });


    it('should remove a file', async (done) => {

        await imageStore.store('test_remove', mockImage);

        const readFile = await imageStore.getData('test_remove', ImageVariant.ORIGINAL);

        expect(readFile).toEqual(mockImage);

        await imageStore.remove('test_remove');

        const expectedPath = testFilePath + testProjectName + '/test_remove';

        try {
            fs.readFileSync(expectedPath);
            fail('Image should have been deleted and fs should throw exception an error.');
        } catch (e) {
            done();
        }

        const expectedThumbnailPath = testFilePath + testProjectName + '/thumbs/test_remove';

        try {
            fs.readFileSync(expectedThumbnailPath);
            fail('Image should have been deleted and fs should throw exception an error.');
        } catch (e) {
            done();
        }
    });
});
