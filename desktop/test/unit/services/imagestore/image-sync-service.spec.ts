import Ajv from 'ajv';
import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { nop } from 'tsfun';
import { ImageSyncService, PouchdbDatastore, ImageStore, IdGenerator, ImageVariant,
    base64Encode } from 'idai-field-core';
import { ExpressServer } from '../../../../src/app/services/express-server';
import { FsAdapter } from '../../../../src/app/services/imagestore/fs-adapter';
import { ThumbnailGenerator } from '../../../../src/app/services/imagestore/thumbnail-generator';
import * as schema from '../../../../../core/api-schemas/files-list.json';

const fs = require('fs');
const request = require('supertest');


/**
 * Test the image syncing interactions between two instances of Field Desktop.
 */
describe('ImageSyncService', () => {

    const mockImage: Buffer = fs.readFileSync(process.cwd() + '/test/test-data/logo.png');
    const localFilePath = process.cwd() + '/test/test-temp/';
    const expressServerFilePath = process.cwd() + '/test/test-temp-remote/';
    const testProjectIdentifier = 'test_tmp_project';
    const password = 'passwörd';

    let imageStore: ImageStore;
    let imageStoreExpressServer: ImageStore;
    let expressMainApp: any;
    let expressFauxtonApp: any;
    let expressServer: ExpressServer;
    let pouchdbDatastore: PouchdbDatastore;

    const ajv = new Ajv();
    const validate = ajv.compile(schema);


    beforeAll(async () => {

        jest.spyOn(console, 'log').mockImplementation(nop);

        fs.mkdirSync(localFilePath, { recursive: true });
        fs.mkdirSync(expressServerFilePath, { recursive: true });

        imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());
        imageStoreExpressServer = new ImageStore(new FsAdapter(), new ThumbnailGenerator());

        expressServer = new ExpressServer(imageStoreExpressServer, undefined, undefined, undefined);
        expressServer.setPassword(password);
        expressServer.setAllowLargeFileUploads(true);

        [expressMainApp, expressFauxtonApp] = await expressServer.setupServer(expressServerFilePath);

        const PouchDB = expressServer.getPouchDB();

        pouchdbDatastore = new PouchdbDatastore(
            (name: string) => new PouchDB(name),
            new IdGenerator()
        );

        await pouchdbDatastore.createEmptyDb(testProjectIdentifier);
    });


    afterAll(async () => {

        (console.log as any).mockRestore();

        await pouchdbDatastore.destroyDb(testProjectIdentifier);

        await new Promise<void>((resolve) => {
            expressMainApp.close(resolve);
        });

        await new Promise<void>((resolve) => {
            expressFauxtonApp.close(resolve);
        });

        fs.rmSync(localFilePath, { recursive: true });
        fs.rmSync(expressServerFilePath, { recursive: true });
    });


    // Re-initialize image store data for each test.
    beforeEach(async () => {

        await imageStore.init(`${localFilePath}imagestore/`, testProjectIdentifier);
        await imageStoreExpressServer.init(`${expressServerFilePath}imagestore/`, testProjectIdentifier);
    });


    afterEach(async () => {

        await imageStore.deleteData(testProjectIdentifier);
        await imageStoreExpressServer.deleteData(testProjectIdentifier);
    });


    test('locally added images are evaluated correctly by diff function', async () => {

        try {
            await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
            await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

            const localData = await imageStore.getFileInfos(
                testProjectIdentifier,
                [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
            );

            if (!await validate(localData)) {
                throw new Error('Local data not valid according to schema definition.');
            }

            const response = await request(expressMainApp)
                .get(`/files/${testProjectIdentifier}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            if (!await validate(response.body)) {
                throw new Error('Data provided by express server not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

            expect(Object.keys(diff.missingRemotely).includes('some_uuid')).toBe(true);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('remotely added images are evaluated correctly by diff function', async () => {

        try {
            await imageStoreExpressServer.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
            await imageStoreExpressServer.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

            const localData = await imageStore.getFileInfos(
                testProjectIdentifier,
                [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
            );

            if (!await validate(localData)) {
                throw new Error('Local data not valid according to schema definition.');
            }

            const response = await request(expressMainApp)
                .get(`/files/${testProjectIdentifier}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            if (!await validate(response.body)) {
                throw new Error('Data provided by express server not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

            expect(Object.keys(diff.missingLocally).includes('some_uuid')).toBe(true);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('locally deleted images are evaluated correctly by diff function', async () => {

        try {
            await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
            await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);
            await imageStore.remove('some_uuid');

            await imageStoreExpressServer.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
            await imageStoreExpressServer.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

            const localData = await imageStore.getFileInfos(
                testProjectIdentifier,
                [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
            );

            if (!await validate(localData)) {
                throw new Error('Local data not valid according to schema definition.');
            }

            const response = await request(expressMainApp)
                .get(`/files/${testProjectIdentifier}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            if (!await validate(response.body)) {
                throw new Error('Data provided by express server not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

            expect(diff.deleteRemotely.includes('some_uuid')).toBe(true);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('remotely deleted images are evaluated correctly by diff function', async () => {

        try {
            await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
            await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

            await imageStoreExpressServer.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
            await imageStoreExpressServer.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);
            await imageStoreExpressServer.remove('some_uuid');

            const localData = await imageStore.getFileInfos(
                testProjectIdentifier,
                [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
            );

            if (!await validate(localData)) {
                throw new Error('Local data not valid according to schema definition.');
            }

            const response = await request(expressMainApp)
                .get(`/files/${testProjectIdentifier}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            if (!await validate(response.body)) {
                throw new Error('Data provided by express server not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

            expect(diff.deleteLocally.includes('some_uuid')).toBe(true);
        } catch (err) {
            throw new Error(err);
        }
    });
});
