const fs = require('fs');

import Ajv from 'ajv';

import { ImageStore, ImageVariant, ImageSyncService } from 'idai-field-core';
import { FsAdapter } from '../../../../src/app/services/imagestore/fs-adapter';
import { RemoteImageStore } from '../../../../src/app/services/imagestore/remote-image-store';
import { ThumbnailGenerator } from '../../../../src/app/services/imagestore/thumbnail-generator';
import { Settings, SyncTarget } from '../../../../src/app/services/settings/settings';
import { SettingsProvider } from '../../../../src/app/services/settings/settings-provider';

import schema from '../../../../../core/api-schemas/files-list.json';
import { assert } from 'console';


/**
 * Test the interactions of desktop class implementations required by {@link ImageStore}.
 */

describe('ImageSyncService', () => {
    let imageStore: ImageStore;
    let remoteImageStore: RemoteImageStore;

    const mockImage: Buffer = fs.readFileSync(process.cwd() + '/test/test-data/logo.png');
    const testFilePath = process.cwd() + '/test/test-temp/imagestore/';
    const testProjectName = 'test_tmp_project';

    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const syncTarget: SyncTarget = {
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

    const settings: Settings = {
        languages: [],
        hostPassword: '',
        syncTargets: {
            [testProjectName]: syncTarget
        },
        username: 'test_user',
        dbs: [],
        selectedProject: testProjectName,
        imagestorePath: testFilePath,
        isAutoUpdateActive: true
    };

    const settingsProvider = new SettingsProvider();

    beforeAll(async done => {
        settingsProvider.setSettings(settings);

        imageStore = new ImageStore(new FsAdapter(), new ThumbnailGenerator());
        await imageStore.init(testFilePath, testProjectName);

        remoteImageStore = new RemoteImageStore(settingsProvider, null);
        done();
    });

    it('deleted images are evaluated correctly by diff function', async done => {

        try {

            await imageStore.store('0', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await imageStore.store('0', mockImage, testProjectName, ImageVariant.THUMBNAIL);
            await imageStore.store('1', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await imageStore.store('1', mockImage, testProjectName, ImageVariant.THUMBNAIL);
            await imageStore.store('2', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await imageStore.store('2', mockImage, testProjectName, ImageVariant.THUMBNAIL);

            await imageStore.remove('0', testProjectName);

            await remoteImageStore.store('0', mockImage, testProjectName, ImageVariant.ORIGINAL);
            await remoteImageStore.store('0', mockImage, testProjectName, ImageVariant.THUMBNAIL);

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

            expect (diff.deleteRemotely[0]).toBe('0');
            expect (Object.keys(diff.missingRemotely).includes('1')).toBe(true);
            expect (Object.keys(diff.missingRemotely).includes('2')).toBe(true);
            done();
        } catch (err) {
            fail(err);
        }
    });
});
