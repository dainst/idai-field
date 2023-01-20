const fs = require('fs');
const execSync = require('child_process').execSync;

import Ajv from 'ajv';

import { ImageStore, ImageVariant, ImageSyncService } from 'idai-field-core';
import { FsAdapter } from '../../src/app/services/imagestore/fs-adapter';
import { RemoteImageStore } from '../../src/app/services/imagestore/remote-image-store';
import { ThumbnailGenerator } from '../../src/app/services/imagestore/thumbnail-generator';
import { Settings, SyncTarget } from '../../src/app/services/settings/settings';
import { SettingsProvider } from '../../src/app/services/settings/settings-provider';

import schema from 'idai-field-core/api-schemas/files-list.json';

/**
 * Test the interactions of desktop class implementations required by {@link ImageStore}.
 */

describe('ImageSyncService', () => {
    let imageStore: ImageStore;
    let remoteImageStore: RemoteImageStore;

    const mockImage: Buffer = fs.readFileSync(process.cwd() + '/test/test-data/logo.png');
    const testFilePath = process.cwd() + '/test/test-temp/imagestore/';
    const testProjectName = 'test_tmp_project';
    const hubContainer = 'field-hub-client-integration-test';

    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const syncTarget: SyncTarget = {
        // see desktop/test/hub-integration/docker-compose.yml
        address: 'http://localhost:4003',
        password: 'pw',
        isSyncActive: true,
        fileSyncPreferences: [
            {
                download: true,
                upload: true,
                variant: ImageVariant.ORIGINAL
            },
            {
                download: true,
                upload: true,
                variant: ImageVariant.THUMBNAIL
            }
        ]
    };

    const settingsMock: Settings = {
        languages: [],
        hostPassword: '',
        syncTargets: {
            [testProjectName]: syncTarget
        },
        username: 'not_relevant_for_the_tests',
        dbs: [],
        selectedProject: 'not_relevant_for_the_tests',
        imagestorePath: testFilePath,
        isAutoUpdateActive: true
    };

    const settingsProviderMock = new SettingsProvider();

    beforeAll(async done => {

        settingsProviderMock.setSettings(settingsMock);

        imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());
        await imageStore.init(testFilePath, testProjectName);

        remoteImageStore = new RemoteImageStore(settingsProviderMock, null);

        const command = `docker exec field-hub-client-integration-test /app/bin/field_hub eval 'FieldHub.CLI.setup()'`;
        execSync(command);
        done();
    });


    // Re-initialize image store data for each test.
    beforeEach(async (done) => {

        await imageStore.init(`${testFilePath}imagestore/`, testProjectName);

        const command = `docker exec ${hubContainer} /app/bin/field_hub eval 'FieldHub.CLI.create_project("${testProjectName}", "${syncTarget.password}")'`;
        execSync(command);
        done();
    });


    afterEach(async (done) => {

        await imageStore.deleteData(testProjectName);

        const command = `docker exec ${hubContainer} /app/bin/field_hub eval 'FieldHub.CLI.delete_project("${testProjectName}")'`;
        execSync(command).toString();

        done();
    });


    afterAll(async (done) => {

        fs.rmSync(testFilePath, { recursive: true });
        done();
    });


    it('locally added images are evaluated correctly by diff function', async done => {

        try {

            await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

            const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

            if (!await validate(localData)){
                throw new Error('Local data not valid according to schema definition.');
            }

            const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
                syncTarget.address, syncTarget.password, testProjectName,
                [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
            );

            if (!await validate(remoteData)){
                throw new Error('Remote data not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

            expect (Object.keys(diff.missingRemotely).includes('some_uuid')).toBe(true);
            done();
        } catch (err) {
            fail(err);
        }
    });


    it('remotely added images are evaluated correctly by diff function', async done => {

        try {

            await remoteImageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await remoteImageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

            const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

            if (!await validate(localData)){
                throw new Error('Local data not valid according to schema definition.');
            }

            const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
                syncTarget.address, syncTarget.password, testProjectName,
                [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
            );

            if (!await validate(remoteData)){
                throw new Error('Remote data not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

            expect (Object.keys(diff.missingLocally).includes('some_uuid')).toBe(true);
            done();
        } catch (err) {
            fail(err);
        }
    });



    it('locally deleted images are evaluated correctly by diff function', async done => {

        try {

            await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);
            await imageStore.remove('some_uuid', testProjectName);

            await remoteImageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await remoteImageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

            const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

            if (!await validate(localData)){
                throw new Error('Local data not valid according to schema definition.');
            }

            const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
                syncTarget.address, syncTarget.password, testProjectName,
                [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
            );

            if (!await validate(remoteData)){
                throw new Error('Remote data not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

            expect (diff.deleteRemotely[0]).toBe('some_uuid');
            done();
        } catch (err) {
            fail(err);
        }
    });

    it('remotely deleted images are evaluated correctly by diff function', async done => {

        try {

            await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await imageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);

            await remoteImageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await remoteImageStore.store('some_uuid', mockImage, testProjectName, ImageVariant.THUMBNAIL);
            await remoteImageStore.remove('some_uuid', testProjectName);

            const localData = await imageStore.getFileInfos(testProjectName, [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]);

            if (!await validate(localData)){
                throw new Error('Local data not valid according to schema definition.');
            }

            const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
                syncTarget.address, syncTarget.password, testProjectName,
                [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
            );

            if (!await validate(remoteData)){
                throw new Error('Remote data not valid according to schema definition.');
            }

            const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

            expect (diff.deleteLocally[0]).toBe('some_uuid');
            done();
        } catch (err) {
            fail(err);
        }
    });
});
