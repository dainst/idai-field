jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronIpc: undefined,
    electronPath: { sep: '/' },
    electronRemote: {
        getGlobal: (key: string) => key === 'config'
            ? { languages: ['de', 'en', 'ko'] }
            : undefined
    }
}), { virtual: true });
jest.mock('../../../../src/app/services/settings/settings-service', () => ({
    SettingsService: class SettingsService {}
}));
jest.mock('../../../../src/app/services/reload', () => ({
    reloadAndSwitchToHomeRoute: jest.fn()
}));
jest.mock('pouchdb-browser', () => jest.fn());
jest.mock('address', () => ({
    ip: () => '127.0.0.1'
}));

import { DecimalPipe } from '@angular/common';
import { DownloadProjectComponent } from '../../../../src/app/components/project/download-project.component';
import { AngularUtility } from '../../../../src/app/angular/angular-utility';
import { ImageVariant } from 'idai-field-core';


describe('DownloadProjectComponent', () => {

    let component: DownloadProjectComponent;
    let syncService: any;
    let settingsProvider: any;
    let menuService: any;
    let imageStore: any;
    let remoteImageStore: any;
    let pouchdbDatastore: any;


    beforeEach(() => {

        syncService = {
            startSync: jest.fn(),
            stopReplication: jest.fn(),
            stopSync: jest.fn()
        };
        settingsProvider = {
            getSettings: jest.fn(() => ({
                selectedProject: 'fieldwork',
                syncTargets: {}
            }))
        };
        menuService = {
            setContext: jest.fn(),
            getContext: jest.fn()
        };
        imageStore = {
            deleteData: jest.fn().mockResolvedValue(undefined),
            getData: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
            remove: jest.fn().mockResolvedValue(undefined),
            store: jest.fn().mockResolvedValue(undefined)
        };
        remoteImageStore = {
            getDataUsingCredentials: jest.fn().mockResolvedValue(Buffer.from('image'))
        };
        pouchdbDatastore = {
            destroyDb: jest.fn().mockResolvedValue(undefined)
        };
        jest.spyOn(AngularUtility, 'blurActiveElement').mockImplementation(() => undefined);

        component = new DownloadProjectComponent(
            { add: jest.fn() } as any,
            syncService,
            {} as any,
            settingsProvider,
            {} as any,
            menuService,
            {} as any,
            imageStore,
            remoteImageStore,
            pouchdbDatastore,
            new DecimalPipe('en-US')
        );
        component.url = 'https://field.example';
        component.projectIdentifier = 'fieldwork';
        component.password = 'secret';
    });


    it('does not retry image batch downloads after cancellation', async () => {

        (component as any).cancelling = true;

        await expect((component as any).loadImageBatch(
            {
                'photo-1': makeFileInfo(ImageVariant.ORIGINAL)
            },
            ['photo-1'],
            5,
            [{ upload: true, download: true, variant: ImageVariant.ORIGINAL }]
        )).rejects.toBe('canceled');

        expect(remoteImageStore.getDataUsingCredentials).not.toHaveBeenCalled();
    });


    it('downloads remote originals and generates local thumbnails when Field Hub has no thumbnail variant', async () => {

        await (component as any).loadImageBatch(
            {
                'photo-1': makeFileInfo(ImageVariant.ORIGINAL)
            },
            ['photo-1'],
            5,
            [{ upload: true, download: true, variant: ImageVariant.THUMBNAIL }]
        );

        expect(remoteImageStore.getDataUsingCredentials).toHaveBeenCalledWith(
            'https://field.example',
            'secret',
            'photo-1',
            ImageVariant.ORIGINAL,
            'fieldwork'
        );
        expect(imageStore.store).toHaveBeenCalledWith(
            'photo-1',
            Buffer.from('image'),
            'fieldwork',
            ImageVariant.ORIGINAL
        );
        expect(imageStore.getData).toHaveBeenCalledWith(
            'photo-1',
            ImageVariant.THUMBNAIL,
            'fieldwork'
        );
    });


    it('waits for every in-flight batch download before retrying a failed batch', async () => {

        const pendingDownload = createDeferred<Buffer>();
        remoteImageStore.getDataUsingCredentials.mockImplementation(
            (_url: string, _password: string, uuid: string) => {
                if (uuid === 'photo-1' && remoteImageStore.getDataUsingCredentials.mock.calls.length === 1) {
                    return Promise.reject(new Error('temporary network failure'));
                }
                if (uuid === 'photo-2' && remoteImageStore.getDataUsingCredentials.mock.calls.length === 2) {
                    return pendingDownload.promise;
                }

                return Promise.resolve(Buffer.from(`retry:${uuid}`));
            }
        );

        const loadPromise = (component as any).loadImageBatch(
            {
                'photo-1': makeFileInfo(ImageVariant.ORIGINAL),
                'photo-2': makeFileInfo(ImageVariant.ORIGINAL)
            },
            ['photo-1', 'photo-2'],
            1,
            [{ upload: true, download: true, variant: ImageVariant.ORIGINAL }]
        );

        await Promise.resolve();
        expect(remoteImageStore.getDataUsingCredentials).toHaveBeenCalledTimes(2);

        pendingDownload.resolve(Buffer.from('slow:image'));
        await loadPromise;

        expect(remoteImageStore.getDataUsingCredentials).toHaveBeenCalledTimes(4);
        expect(imageStore.store).toHaveBeenCalledWith(
            'photo-2',
            Buffer.from('slow:image'),
            'fieldwork',
            ImageVariant.ORIGINAL
        );
    });


    it('waits for settled in-flight image downloads before deleting canceled project data', async () => {

        const pendingDownload = createDeferred<void>();
        const failedDownload = Promise.reject(new Error('previous download failed'));
        failedDownload.catch(() => undefined);
        (component as any).fileDownloadPromises = [
            failedDownload,
            pendingDownload.promise
        ];

        const cancelPromise = (component as any).cancel({
            close: jest.fn()
        });

        await Promise.resolve();
        expect(imageStore.deleteData).not.toHaveBeenCalled();

        pendingDownload.resolve();
        await cancelPromise;

        expect(pouchdbDatastore.destroyDb).toHaveBeenCalledWith('fieldwork');
        expect(imageStore.deleteData).toHaveBeenCalledWith('fieldwork');
    });
});


const makeFileInfo = (variant: ImageVariant) => ({
    deleted: false,
    types: [variant],
    variants: [{ name: variant, size: 1 }]
});


const createDeferred = <T,>() => {

    let resolve!: (value?: T | PromiseLike<T>) => void;
    const promise = new Promise<T | undefined>((resolvePromise) => {
        resolve = resolvePromise;
    });

    return { promise, resolve };
};
