jest.mock('src/app/electron/electron', () => ({
    electronCrypto: require('crypto'),
    electronFs: { promises: require('fs').promises },
    electronPath: { sep: '/' },
    electronRemote: {
        app: { getVersion: () => 'test' },
        getGlobal: (key: string) => key === 'appDataPath'
            ? 'test/test-temp'
            : undefined
    }
}), { virtual: true });
jest.mock('pouchdb-browser', () => require('pouchdb-node'));
jest.mock('axios', () => require('axios/dist/node/axios.cjs'));

import Ajv from 'ajv';
import { nop } from 'tsfun';
import {
    IdGenerator,
    PouchdbDatastore,
    ImageStore,
    ImageVariant,
    base64Encode,
    buildFieldHubFileUrlWithType
} from 'idai-field-core';
import { ExpressServer } from '../../../src/app/services/express-server/express-server';
import { FsAdapter } from '../../../src/app/services/imagestore/fs-adapter';
import { RemoteImageStore } from '../../../src/app/services/imagestore/remote-image-store';
import { ThumbnailGenerator } from '../../../src/app/services/imagestore/thumbnail-generator';
import * as schema from '../../../../core/api-schemas/files-list.json';

const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const request = require('supertest');


describe('ExpressServer', () => {

    const testFilePath = process.cwd() + '/test/test-temp/';
    const testProjectIdentifier = 'test_tmp_project';
    const password = 'passwörd';
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const mockImage: Buffer = fs.readFileSync( process.cwd() + '/test/test-data/logo.png');
    const mockImageStoredMetadata = {
        size_bytes: mockImage.byteLength,
        md5: getHash(mockImage, 'md5'),
        sha256: getHash(mockImage, 'sha256')
    };

    let expressMainApp: any;
    let expressFauxtonApp: any;
    let expressServer: ExpressServer;
    let pouchdbDatastore: PouchdbDatastore;
    let imageStore: ImageStore;
    let PouchDB: any;
    let previousAxiosAdapter: any;


    beforeAll(async () => {

        jest.spyOn(console, 'log').mockImplementation(nop);
        previousAxiosAdapter = axios.defaults.adapter;
        axios.defaults.adapter = 'http';

        fs.mkdirSync(testFilePath, { recursive: true });

        imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());

        expressServer = new ExpressServer(imageStore, undefined, undefined, undefined, undefined);
        expressServer.setPassword(password);
        expressServer.setAllowLargeFileUploads(true);

        [expressMainApp, expressFauxtonApp] = await expressServer.setupServer(testFilePath);

        PouchDB = expressServer.getPouchDB();

        pouchdbDatastore = new PouchdbDatastore(
            (name: string) => new PouchDB(name),
            new IdGenerator()
        );

        await pouchdbDatastore.createEmptyDb(testProjectIdentifier);
    });


    // Re-initialize image store data for each test.
    beforeEach(async () => {

        expressServer.setAllowLargeFileUploads(true);
        await imageStore.init(`${testFilePath}imagestore/`, testProjectIdentifier);
    });


    afterEach(async () => {

        await imageStore.deleteData(testProjectIdentifier);
    });


    afterAll(async () => {

        (console.log as any).mockRestore();
        axios.defaults.adapter = previousAxiosAdapter;

        await pouchdbDatastore.destroyDb(testProjectIdentifier);

        await new Promise<void>((resolve) => {
            expressMainApp.close(resolve);
        });

        await new Promise<void>((resolve) => {
            expressFauxtonApp.close(resolve);
        });

        await closePouchDB(PouchDB);

        await removeTestFiles(testFilePath);
    });


    test('/files/:project without credentials returns 401', async () => {

        request(expressMainApp)
            .get('/files/test_tmp_project')
            .set('Content-Type', 'application/json')
            .expect(401)
            .end((err: Error, res: any) => {
                if (err) fail(err);
            });
    });


    test('/files/:project returns an empty index', async () => {

        try {
            const response = await request(expressMainApp)
                .get('/files/test_tmp_project')
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            // Body should be {}
            expect(Object.keys(response.body).length).toBe(0);
            expect(validate(response.body)).toBe(true);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('/files/:project/:uuid is able to store thumbnail images', async () => {

        try {
            const response = await request(expressMainApp)
                .put(`/files/test_tmp_project/1?type=thumbnail_image`)
                .send(mockImage)
                .set('Content-Type', 'image/x-www-form-urlencoded')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            expect(response.body).toEqual(mockImageStoredMetadata);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('/files/:project/:uuid is able to store original images', async () => {

        try {
            const response = await request(expressMainApp)
                .put(`/files/test_tmp_project/1?type=original_image`)
                .send(mockImage)
                .set('Content-Type', 'image/x-www-form-urlencoded')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            expect(response.body).toEqual(mockImageStoredMetadata);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('/files/:project/:uuid is able to block original images (large files)', async () => {

        try {
            expressServer.setAllowLargeFileUploads(false);
            await request(expressMainApp)
                .put(`/files/test_tmp_project/1?type=original_image`)
                .send(mockImage)
                .set('Content-Type', 'image/x-www-form-urlencoded')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(409);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('/files/:project returns an index of previously stored images', async () => {

        try {
            const uuids = ['1', '2'];

            for (const uuid of uuids) {
                await request(expressMainApp)
                    .put(`/files/test_tmp_project/${uuid}?type=thumbnail_image`)
                    .send(mockImage)
                    .set('Content-Type', 'image/x-www-form-urlencoded')
                    .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                    .expect(200);
            }

            const response = await request(expressMainApp)
                .get('/files/test_tmp_project')
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            expect(Object.keys(response.body).length).toBe(2);
            expect(validate(response.body)).toBe(true);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('/files/:project returns previously deleted images marked as deleted', async () => {

        try {
            const uuids = ['1', '2', '3'];
            for (const uuid of uuids) {
                await request(expressMainApp)
                    .put(`/files/test_tmp_project/${uuid}?type=thumbnail_image`)
                    .send(mockImage)
                    .set('Content-Type', 'image/x-www-form-urlencoded')
                    .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                    .expect(200);
            }

            await request(expressMainApp)
                .delete(`/files/test_tmp_project/${uuids[0]}`)
                .send(mockImage)
                .set('Content-Type', 'image/x-www-form-urlencoded')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            const response = await request(expressMainApp)
                .get('/files/test_tmp_project')
                .set('Content-Type', 'application/json')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);

            expect(Object.keys(response.body).length).toBe(3);
            expect(response.body[uuids[0]].deleted).toBe(true);
            expect(response.body[uuids[1]].deleted).toBe(false);
            expect(response.body[uuids[2]].deleted).toBe(false);
            expect(validate(response.body)).toBe(true);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('tablet-style original upload can be listed and downloaded by the desktop remote image store', async () => {

        const uuid = 'tablet photo 1';
        const syncUrl = 'http://127.0.0.1:3000/db/test_tmp_project';

        const uploadResponse = await axios({
            method: 'put',
            url: buildFieldHubFileUrlWithType(
                syncUrl,
                testProjectIdentifier,
                uuid,
                ImageVariant.ORIGINAL
            ),
            data: mockImage,
            headers: {
                'Content-Type': 'application/octet-stream',
                Authorization: `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`
            }
        });

        const remoteImageStore = new RemoteImageStore({
            getSettings: () => ({
                syncTargets: {
                    [testProjectIdentifier]: {
                        address: syncUrl,
                        password,
                        isSyncActive: true,
                        fileSyncPreferences: []
                    }
                }
            })
        } as any, null);

        const fileInfos = await remoteImageStore.getFileInfos(
            testProjectIdentifier,
            [ImageVariant.ORIGINAL]
        );
        const downloadedImage = await remoteImageStore.getData(
            uuid,
            ImageVariant.ORIGINAL,
            testProjectIdentifier
        );

        expect(uploadResponse.data).toEqual(mockImageStoredMetadata);
        expect(fileInfos[uuid].types).toContain(ImageVariant.ORIGINAL);
        expect(fileInfos[uuid].deleted).toBe(false);
        expect(downloadedImage.equals(mockImage)).toBe(true);
    });
});


async function closePouchDB(PouchDB: any) {

    if (PouchDB.__dbCacheMap) {
        const cachedDbs: Array<any> = Array.from(PouchDB.__dbCacheMap.values());

        for (const db of cachedDbs) {
            if (db.stopReplicatorDaemon) await db.stopReplicatorDaemon().catch(nop);
            if (db.close) await db.close().catch(nop);
        }
        PouchDB.__dbCacheMap.clear();
    }

    if (PouchDB.resetAllDbs) await PouchDB.resetAllDbs();
}


function getHash(data: Buffer, algorithm: 'md5'|'sha256'): string {

    return crypto.createHash(algorithm)
        .update(data)
        .digest('hex');
}


async function removeTestFiles(filePath: string) {

    for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            fs.rmSync(filePath, { recursive: true, force: true });
            return;
        } catch (err) {
            if (attempt === 10) throw err;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
}
