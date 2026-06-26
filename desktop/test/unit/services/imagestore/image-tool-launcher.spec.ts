jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronPath: { sep: '/' },
    electronRemote: undefined
}), { virtual: true });

import { ImageVariant } from 'idai-field-core';
import { ImageToolLauncher } from '../../../../src/app/services/imagestore/image-tool-launcher';


describe('ImageToolLauncher', () => {

    it('does not redownload thumbnails that are already available locally', () => {

        const launcher = createLauncher();
        (launcher as any).originalFileInfos = {};
        (launcher as any).remoteOriginalFileInfos = {
            'photo-1': makeFileInfo(ImageVariant.ORIGINAL)
        };
        (launcher as any).thumbnailFileInfos = {
            'photo-1': makeFileInfo(ImageVariant.THUMBNAIL)
        };
        (launcher as any).remoteThumbnailFileInfos = {
            'photo-1': makeFileInfo(ImageVariant.THUMBNAIL)
        };

        expect((launcher as any).getDownloadableImages([
            makeImageDocument('photo-1')
        ])).toEqual([
            {
                image: makeImageDocument('photo-1'),
                downloadThumbnail: false
            }
        ]);
    });


    it('downloads a remote thumbnail when the original is missing locally and the thumbnail is not local yet', () => {

        const launcher = createLauncher();
        (launcher as any).originalFileInfos = {};
        (launcher as any).remoteOriginalFileInfos = {
            'photo-1': makeFileInfo(ImageVariant.ORIGINAL)
        };
        (launcher as any).thumbnailFileInfos = {};
        (launcher as any).remoteThumbnailFileInfos = {
            'photo-1': makeFileInfo(ImageVariant.THUMBNAIL)
        };

        expect((launcher as any).getDownloadableImages([
            makeImageDocument('photo-1')
        ])[0].downloadThumbnail).toBe(true);
    });
});


function createLauncher(): ImageToolLauncher {

    return new ImageToolLauncher(
        {} as any,
        {} as any,
        {
            settingsChangesNotifications: () => ({ subscribe: () => undefined }),
            getSettings: () => ({ selectedProject: 'fieldwork' })
        } as any,
        {} as any,
        {} as any,
        {} as any
    );
}


function makeImageDocument(id: string) {

    return {
        resource: {
            id,
            identifier: id
        }
    };
}


function makeFileInfo(variant: ImageVariant) {

    return {
        deleted: false,
        types: [variant],
        variants: [
            {
                name: variant,
                size: 100
            }
        ]
    };
}
