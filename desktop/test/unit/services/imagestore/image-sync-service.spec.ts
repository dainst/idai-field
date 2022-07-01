const fs = require('fs');
const request = typeof window !== 'undefined' ? window.require('supertest') : require('supertest');

import { ImageSyncService, PouchdbDatastore } from 'idai-field-core';
import { ImageStore, IdGenerator, ImageVariant } from 'idai-field-core';
import { ExpressServer } from '../../../../src/app/services/express-server';
import { FsAdapter } from '../../../../src/app/services/imagestore/fs-adapter';
import { ThumbnailGenerator } from '../../../../src/app/services/imagestore/thumbnail-generator';


import Ajv from 'ajv';
import schema from 'idai-field-core/api-schemas/files-list.json';

/**
 * Test the image syncing interactions between two desktop clients.
 */

describe('ImageSyncService', () => {
  const mockImage: Buffer = fs.readFileSync(process.cwd() + '/test/test-data/logo.png');
  const localFilePath = process.cwd() + '/test/test-temp/';
  const expressServerFilePath = process.cwd() + '/test/test-temp-remote/';
  const testProjectName = 'test_tmp_project';
  const password = 'pw';

  let imageStore: ImageStore;
  let imageStoreExpressServer: ImageStore;
  let expressMainApp: any;
  let expressFauxtonApp: any;
  let expressServer: ExpressServer;
  let pouchdbDatastore: PouchdbDatastore;

  const ajv = new Ajv();
  const validate = ajv.compile(schema);


  beforeAll(async done => {
    fs.mkdirSync(localFilePath, { recursive: true });
    fs.mkdirSync(expressServerFilePath, { recursive: true });

    imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());
    imageStoreExpressServer = new ImageStore(new FsAdapter(), new ThumbnailGenerator());

    expressServer = new ExpressServer(imageStoreExpressServer);
    expressServer.setPassword(password);
    expressServer.setAllowLargeFileUploads(true);

    [expressMainApp, expressFauxtonApp] = await expressServer.setupServer(expressServerFilePath);

    const PouchDB = expressServer.getPouchDB();

    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );

    await pouchdbDatastore.createEmptyDb(testProjectName);

    done();
  });


  afterAll(async (done) => {
    await pouchdbDatastore.destroyDb(testProjectName);

    await new Promise<void>((resolve) => {
      expressMainApp.close(resolve);
    });

    await new Promise<void>((resolve) => {
      expressFauxtonApp.close(resolve);
    });

    fs.rmSync(localFilePath, { recursive: true });
    fs.rmSync(expressServerFilePath, { recursive: true });
    done();
  });


  // Re-initialize image store data for each test.
  beforeEach(async (done) => {
    await imageStore.init(`${localFilePath}imagestore/`, testProjectName);
    await imageStoreExpressServer.init(`${expressServerFilePath}imagestore/`, testProjectName);
    done();
  });


  afterEach(async (done) => {
    await imageStore.deleteData(testProjectName);
    await imageStoreExpressServer.deleteData(testProjectName);
    done();
  });


  it('locally added images are evaluated correctly by diff function', async done => {

    try {

      await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
      await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

      const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

      if (!await validate(localData)) {
        throw new Error('Local data not valid according to schema definition.');
      }

      const response = await request(expressMainApp)
        .get('/files/test_tmp_project')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Basic ${btoa(testProjectName + ':' + password)}`)
        .expect(200);

      if (!await validate(response.body)) {
        throw new Error('Data provided by express server not valid according to schema definition.');
      }

      const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

      expect(Object.keys(diff.missingRemotely).includes('some_uuid')).toBe(true);
      done();
    } catch (err) {
      fail(err);
    }
  });


  it('remotely added images are evaluated correctly by diff function', async done => {

    try {

      await imageStoreExpressServer.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
      await imageStoreExpressServer.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

      const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

      if (!await validate(localData)) {
        throw new Error('Local data not valid according to schema definition.');
      }

      const response = await request(expressMainApp)
        .get('/files/test_tmp_project')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Basic ${btoa(testProjectName + ':' + password)}`)
        .expect(200);

      if (!await validate(response.body)) {
        throw new Error('Data provided by express server not valid according to schema definition.');
      }

      const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

      expect(Object.keys(diff.missingLocally).includes('some_uuid')).toBe(true);
      done();
    } catch (err) {
      fail(err);
    }
  });



  it('locally deleted images are evaluated correctly by diff function', async done => {

    try {

      await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
      await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);
      await imageStore.remove('some_uuid');

      await imageStoreExpressServer.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
      await imageStoreExpressServer.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

      const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

      if (!await validate(localData)) {
        throw new Error('Local data not valid according to schema definition.');
      }

      const response = await request(expressMainApp)
        .get('/files/test_tmp_project')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Basic ${btoa(testProjectName + ':' + password)}`)
        .expect(200);

      if (!await validate(response.body)) {
        throw new Error('Data provided by express server not valid according to schema definition.');
      }

      const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

      expect(diff.deleteRemotely.includes('some_uuid')).toBe(true);
      done();
    } catch (err) {
      fail(err);
    }
  });


  it('remotely deleted images are evaluated correctly by diff function', async done => {

    try {

      await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
      await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

      await imageStoreExpressServer.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
      await imageStoreExpressServer.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);
      await imageStoreExpressServer.remove('some_uuid');

      const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

      if (!await validate(localData)) {
        throw new Error('Local data not valid according to schema definition.');
      }

      const response = await request(expressMainApp)
        .get('/files/test_tmp_project')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Basic ${btoa(testProjectName + ':' + password)}`)
        .expect(200);

      if (!await validate(response.body)) {
        throw new Error('Data provided by express server not valid according to schema definition.');
      }

      const diff = await ImageSyncService.evaluateDifference(localData, response.body, ImageVariant.THUMBNAIL);

      expect(diff.deleteLocally.includes('some_uuid')).toBe(true);
      done();
    } catch (err) {
      fail(err);
    }
  });
});
