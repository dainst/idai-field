import Ajv from 'ajv';
import { ImageStore, ImageVariant, ImageSyncService } from 'idai-field-core';
import { FsAdapter } from '../../src/app/services/imagestore/fs-adapter';
import { RemoteImageStore } from '../../src/app/services/imagestore/remote-image-store';
import { ThumbnailGenerator } from '../../src/app/services/imagestore/thumbnail-generator';
import { Settings } from '../../src/app/services/settings/settings';
import { SettingsProvider } from '../../src/app/services/settings/settings-provider';
import { SyncTarget } from '../../src/app/services/settings/sync-target';
import * as schema from '../../../core/api-schemas/files-list.json';

const fs = require('fs');
const execSync = require('child_process').execSync;


/**
 * Test the interactions of desktop class implementations required by {@link ImageStore}.
 */
describe('ImageSyncService', () => {

    let imageStore: ImageStore;
    let remoteImageStore: RemoteImageStore;

    const mockImage: Buffer = fs.readFileSync(process.cwd() + '/test/test-data/logo.png');
    const testFilePath = process.cwd() + '/test/test-temp/imagestore/';
    const testProjectIdentifier = 'test_tmp_project';
    const hubContainer = 'field-hub-client-integration-test';

    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const syncTarget: SyncTarget = {
        // see desktop/test/hub-integration/docker-compose.yml
        address: 'http://localhost:4003',
        password: 'passwörd',
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
            [testProjectIdentifier]: syncTarget
        },
        username: 'not_relevant_for_the_tests',
        dbs: [],
        selectedProject: 'not_relevant_for_the_tests',
        imagestorePath: testFilePath,
        isAutoUpdateActive: true
    };

    const settingsProviderMock = new SettingsProvider();


    beforeAll(async () => {

        settingsProviderMock.setSettings(settingsMock);

        imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());
        await imageStore.init(testFilePath, testProjectIdentifier);

        remoteImageStore = new RemoteImageStore(settingsProviderMock, null);

        const command = `docker exec field-hub-client-integration-test /app/bin/field_hub eval 'FieldHub.CLI.setup()'`;
        execSync(command);
    });


    // Re-initialize image store data for each test.
    beforeEach(async () => {

        await imageStore.init(`${testFilePath}imagestore/`, testProjectIdentifier);

        const command = `docker exec ${hubContainer} /app/bin/field_hub eval `
            + `'FieldHub.CLI.create_project("${testProjectIdentifier}", "${syncTarget.password}")'`;
        execSync(command);
    });


    afterEach(async () => {

        await imageStore.deleteData(testProjectIdentifier);

        const command = `docker exec ${hubContainer} /app/bin/field_hub eval `
            + `'FieldHub.CLI.delete_project("${testProjectIdentifier}")'`;
        execSync(command).toString();
    });


    afterAll(() => {

        fs.rmSync(testFilePath, { recursive: true });
    });


    test('locally added images are evaluated correctly by diff function', async () => {

        await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
        await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

        const localData = await imageStore.getFileInfos(
            testProjectIdentifier,
            [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
        );

        if (!await validate(localData)) {
            throw new Error('Local data not valid according to schema definition.');
        }

        const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
            syncTarget.address, syncTarget.password, testProjectIdentifier,
            [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
        );

        if (!await validate(remoteData)) {
            throw new Error('Remote data not valid according to schema definition.');
        }

        const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

        expect(Object.keys(diff.missingRemotely).includes('some_uuid')).toBe(true);
    });


    test('remotely added images are evaluated correctly by diff function', async () => {

        await remoteImageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
        await remoteImageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

        const localData = await imageStore.getFileInfos(
            testProjectIdentifier,
            [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
        );

        if (!await validate(localData)) {
            throw new Error('Local data not valid according to schema definition.');
        }

        const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
            syncTarget.address, syncTarget.password, testProjectIdentifier,
            [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
        );

        if (!await validate(remoteData)) {
            throw new Error('Remote data not valid according to schema definition.');
        }

        const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

        expect(Object.keys(diff.missingLocally).includes('some_uuid')).toBe(true);
    });


    test('locally deleted images are evaluated correctly by diff function', async () => {

        await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
        await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);
        await imageStore.remove('some_uuid', testProjectIdentifier);

        await remoteImageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
        await remoteImageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

        const localData = await imageStore.getFileInfos(
            testProjectIdentifier,
            [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
        );

        if (!await validate(localData)) {
            throw new Error('Local data not valid according to schema definition.');
        }

        const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
            syncTarget.address, syncTarget.password, testProjectIdentifier,
            [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
        );

        if (!await validate(remoteData)) {
            throw new Error('Remote data not valid according to schema definition.');
        }

        const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

        expect(diff.deleteRemotely[0]).toBe('some_uuid');
    });


    test('remotely deleted images are evaluated correctly by diff function', async () => {

        await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
        await imageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);

        await remoteImageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.ORIGINAL);
        await remoteImageStore.store('some_uuid', mockImage, testProjectIdentifier, ImageVariant.THUMBNAIL);
        await remoteImageStore.remove('some_uuid', testProjectIdentifier);

        const localData = await imageStore.getFileInfos(
            testProjectIdentifier,
            [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
        );

        if (!await validate(localData)) {
            throw new Error('Local data not valid according to schema definition.');
        }

        const remoteData = await remoteImageStore.getFileInfosUsingCredentials(
            syncTarget.address, syncTarget.password, testProjectIdentifier,
            [ImageVariant.ORIGINAL, ImageVariant.THUMBNAIL]
        );

        if (!await validate(remoteData)) {
            throw new Error('Remote data not valid according to schema definition.');
        }

        const diff = await ImageSyncService.evaluateDifference(localData, remoteData, ImageVariant.THUMBNAIL);

        expect(diff.deleteLocally[0]).toBe('some_uuid');
    });
});
