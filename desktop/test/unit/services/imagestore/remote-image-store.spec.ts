jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronPath: { sep: '/' },
    electronRemote: {
        getGlobal: (key: string) => key === 'os'
            ? 'Windows_NT'
            : undefined
    }
}), { virtual: true });

import axios from 'axios';
import { ImageVariant, base64Encode } from 'idai-field-core';
import { M } from '../../../../src/app/components/messages/m';
import { RemoteImageStore } from '../../../../src/app/services/imagestore/remote-image-store';
import { SyncTarget } from '../../../../src/app/services/settings/sync-target';


jest.mock('axios');
jest.mock('address', () => ({
    ip: () => '127.0.0.1'
}));


describe('RemoteImageStore', () => {

    const project = 'fieldwork';
    const password = 'field-secret';
    const mockedAxios = axios as jest.MockedFunction<typeof axios>;
    const syncTarget: SyncTarget = {
        address: 'http://fieldhub.test',
        password,
        isSyncActive: true,
        fileSyncPreferences: []
    };
    let messages: { add: jest.Mock };
    let remoteImageStore: RemoteImageStore;


    beforeEach(() => {

        mockedAxios.mockReset();
        messages = { add: jest.fn() };
        remoteImageStore = new RemoteImageStore({
            getSettings: () => ({
                syncTargets: {
                    [project]: syncTarget
                }
            })
        } as any, messages as any);
    });


    it('uploads an image variant using basic auth without adding the password to the URL', async () => {

        mockedAxios.mockResolvedValue({ status: 201 } as any);

        const status = await remoteImageStore.store(
            'image-1',
            Buffer.from('image data'),
            project,
            ImageVariant.ORIGINAL
        );

        const request = mockedAxios.mock.calls[0][0] as any;
        expect(status).toBe(201);
        expect(request.method).toBe('put');
        expect(request.url).toBe('http://fieldhub.test/files/fieldwork/image-1');
        expect(request.url).not.toContain(password);
        expect(request.params).toEqual({ type: ImageVariant.ORIGINAL });
        expect(request.headers['Content-Type']).toBe('application/octet-stream');
        expect(request.headers.Authorization).toBe(
            `Basic ${base64Encode(project + ':' + password)}`
        );
    });


    it('normalizes database sync URLs before querying Field Hub files', async () => {

        mockedAxios.mockResolvedValue({ data: {} } as any);

        await remoteImageStore.getFileInfosUsingCredentials(
            'http://fieldhub.test/db/fieldwork',
            password,
            project,
            [ImageVariant.THUMBNAIL]
        );

        const request = mockedAxios.mock.calls[0][0] as any;
        expect(request.method).toBe('get');
        expect(request.url).toBe('http://fieldhub.test/files/fieldwork');
        expect(request.headers.Authorization).toBe(
            `Basic ${base64Encode(project + ':' + password)}`
        );
    });


    it('encodes file URL path segments when downloading image data', async () => {

        mockedAxios.mockResolvedValue({ data: Buffer.from('image') } as any);

        await remoteImageStore.getDataUsingCredentials(
            'http://fieldhub.test/db',
            password,
            'photo 1',
            ImageVariant.ORIGINAL,
            'field work' as any
        );

        const request = mockedAxios.mock.calls[0][0] as any;
        expect(request.url).toBe('http://fieldhub.test/files/field%20work/photo%201');
    });


    it('turns remote large-file upload rejections into a warning status', async () => {

        mockedAxios.mockRejectedValue({ response: { status: 409 } });

        await expect(remoteImageStore.store(
            'image-1',
            Buffer.from('image data'),
            project,
            ImageVariant.ORIGINAL
        )).resolves.toBe(409);

        expect(messages.add).toHaveBeenCalledWith([
            M.REMOTEIMAGESTORE_WARNING_LARGE_FILE_UPLOAD_BLOCKED_BY_PEER
        ]);
    });


    it('preserves connection errors without replacing them with a response access error', async () => {

        const networkError = new Error('network down');
        mockedAxios.mockRejectedValue(networkError);

        await expect(remoteImageStore.store(
            'image-1',
            Buffer.from('image data'),
            project,
            ImageVariant.ORIGINAL
        )).rejects.toBe(networkError);

        expect(messages.add).not.toHaveBeenCalled();
    });
});
