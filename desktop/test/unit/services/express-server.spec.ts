import Ajv from 'ajv';
import { describe, expect, test, beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';
import { nop } from 'tsfun';
import { IdGenerator, PouchdbDatastore, ImageStore, base64Encode} from 'idai-field-core';
import { ExpressServer } from '../../../src/app/services/express-server';
import { FsAdapter } from '../../../src/app/services/imagestore/fs-adapter';
import { ThumbnailGenerator } from '../../../src/app/services/imagestore/thumbnail-generator';
import * as schema from '../../../../core/api-schemas/files-list.json';

const fs = require('fs');
const request = require('supertest');


describe('ExpressServer', () => {

    const testFilePath = process.cwd() + '/test/test-temp/';
    const testProjectIdentifier = 'test_tmp_project';
    const password = 'passwörd';
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const mockImage: Buffer = fs.readFileSync( process.cwd() + '/test/test-data/logo.png');

    let expressMainApp: any;
    let expressFauxtonApp: any;
    let expressServer: ExpressServer;
    let pouchdbDatastore: PouchdbDatastore;
    let imageStore: ImageStore;


    beforeAll(async () => {

        jest.spyOn(console, 'log').mockImplementation(nop);

        fs.mkdirSync(testFilePath, { recursive: true });

        imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());

        expressServer = new ExpressServer(imageStore, undefined, undefined, undefined);
        expressServer.setPassword(password);
        expressServer.setAllowLargeFileUploads(true);

        [expressMainApp, expressFauxtonApp] = await expressServer.setupServer(testFilePath);

        const PouchDB = expressServer.getPouchDB();

        pouchdbDatastore = new PouchdbDatastore(
            (name: string) => new PouchDB(name),
            new IdGenerator()
        );

        await pouchdbDatastore.createEmptyDb(testProjectIdentifier);
    });


    // Re-initialize image store data for each test.
    beforeEach(async () => {

        await imageStore.init(`${testFilePath}imagestore/`, testProjectIdentifier);
    });


    afterEach(async () => {

        await imageStore.deleteData(testProjectIdentifier);
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

        fs.rmSync(testFilePath, { recursive: true });
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
            await request(expressMainApp)
                .put(`/files/test_tmp_project/1?type=thumbnail_image`)
                .send(mockImage)
                .set('Content-Type', 'image/x-www-form-urlencoded')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);
        } catch (err) {
            throw new Error(err);
        }
    });


    test('/files/:project/:uuid is able to store original images', async () => {

        try {
            await request(expressMainApp)
                .put(`/files/test_tmp_project/1?type=original_image`)
                .send(mockImage)
                .set('Content-Type', 'image/x-www-form-urlencoded')
                .set('Authorization', `Basic ${base64Encode(testProjectIdentifier + ':' + password)}`)
                .expect(200);
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
});
