import { FileInfo, ImageSyncService, ImageVariant } from '../../../src/datastore/image';
import { SyncStatus } from '../../../src/datastore/sync-status';


describe('ImageSyncService', () => {

    const project = 'fieldwork';


    it('downloads remote originals as fallback for thumbnail sync', async done => {

        const originalData = Buffer.from('original image');
        const imageStore = new MemoryImageStore(project);
        const remoteImageStore = new MemoryRemoteImageStore({
            'photo-1': makeFileInfo(ImageVariant.ORIGINAL, originalData.length)
        }, {
            [ImageVariant.ORIGINAL]: {
                'photo-1': originalData
            }
        });
        const service = new ImageSyncService(
            imageStore as any,
            remoteImageStore as any,
            makeDatastore() as any
        );
        (service as any).longIntervalDuration = 1000 * 60 * 60;

        spyOn(console, 'log');
        spyOn(console, 'error');

        try {
            service.startSync({
                download: true,
                upload: false,
                variant: ImageVariant.THUMBNAIL
            });

            await waitFor(() => service.getStatus()[ImageVariant.THUMBNAIL] === SyncStatus.InSync);

            expect(remoteImageStore.getFileInfos).toHaveBeenCalledWith(
                project,
                [ImageVariant.THUMBNAIL, ImageVariant.ORIGINAL]
            );
            expect(remoteImageStore.getData).toHaveBeenCalledWith(
                'photo-1',
                ImageVariant.ORIGINAL,
                project
            );
            expect((await imageStore.getFileInfos(project, [ImageVariant.ORIGINAL]))['photo-1'])
                .toBeDefined();
            expect((await imageStore.getFileInfos(project, [ImageVariant.THUMBNAIL]))['photo-1'])
                .toBeDefined();
            expect(console.error).not.toHaveBeenCalled();

            service.stopAllSyncing();
            done();
        } catch (err) {
            service.stopAllSyncing();
            done.fail(err);
        }
    });


    it('redacts credentials from image synchronization error messages', () => {

        const message = ImageSyncService.getSanitizedErrorMessage({
            message: 'upload failed password=field-secret Authorization: Basic abc123',
            response: { status: 500 },
            code: 'ERR_NETWORK'
        });

        expect(message).not.toContain('field-secret');
        expect(message).not.toContain('abc123');
        expect(message).toContain('[redacted]');
        expect(message).toContain('status 500');
    });
});


class MemoryImageStore {

    private files: { [variant in ImageVariant]: { [uuid: string]: Buffer } } = {
        original_image: {},
        thumbnail_image: {},
        display_image: {}
    };


    constructor(private activeProject: string) {}


    public getActiveProject = () => this.activeProject;


    public async getFileInfos(_project: string, types: ImageVariant[] = []): Promise<{ [uuid: string]: FileInfo }> {

        const result: { [uuid: string]: FileInfo } = {};
        const variants = types.length > 0 ? types : Object.values(ImageVariant);

        for (const variant of variants) {
            for (const [uuid, data] of Object.entries(this.files[variant])) {
                if (!result[uuid]) {
                    result[uuid] = {
                        deleted: false,
                        types: [],
                        variants: []
                    };
                }

                result[uuid].types.push(variant);
                result[uuid].variants.push({
                    name: variant,
                    size: data.length
                });
            }
        }

        return result;
    }


    public async store(uuid: string, data: Buffer, _project: string, variant: ImageVariant): Promise<void> {

        this.files[variant][uuid] = data;
    }


    public async getData(uuid: string, variant: ImageVariant, _project: string): Promise<Buffer> {

        if (variant === ImageVariant.THUMBNAIL
                && !this.files[ImageVariant.THUMBNAIL][uuid]
                && this.files[ImageVariant.ORIGINAL][uuid]) {
            this.files[ImageVariant.THUMBNAIL][uuid] = Buffer.from(
                `thumbnail:${this.files[ImageVariant.ORIGINAL][uuid].toString()}`
            );
        }

        return this.files[variant][uuid];
    }


    public async remove(uuid: string): Promise<void> {

        delete this.files[ImageVariant.ORIGINAL][uuid];
        delete this.files[ImageVariant.THUMBNAIL][uuid];
        delete this.files[ImageVariant.DISPLAY][uuid];
    }
}


class MemoryRemoteImageStore {

    public getFileInfos: jasmine.Spy;
    public getData: jasmine.Spy;
    public store: jasmine.Spy;
    public remove: jasmine.Spy;


    constructor(private files: { [uuid: string]: FileInfo },
                private data: { [variant in ImageVariant]?: { [uuid: string]: Buffer } }) {

        this.getFileInfos = jasmine.createSpy('getFileInfos').and.callFake(
            async (_project: string, types: ImageVariant[]) => this.filterFileInfos(types)
        );
        this.getData = jasmine.createSpy('getData').and.callFake(
            async (uuid: string, variant: ImageVariant) => this.data[variant]?.[uuid] ?? null
        );
        this.store = jasmine.createSpy('store').and.returnValue(Promise.resolve(200));
        this.remove = jasmine.createSpy('remove').and.returnValue(Promise.resolve());
    }


    private filterFileInfos(types: ImageVariant[]): { [uuid: string]: FileInfo } {

        const result: { [uuid: string]: FileInfo } = {};

        for (const [uuid, fileInfo] of Object.entries(this.files)) {
            const variants = fileInfo.variants.filter(variant => types.includes(variant.name));
            if (variants.length === 0) continue;

            result[uuid] = {
                deleted: fileInfo.deleted,
                types: variants.map(variant => variant.name),
                variants
            };
        }

        return result;
    }
}


function makeFileInfo(variant: ImageVariant, size: number): FileInfo {

    return {
        deleted: false,
        types: [variant],
        variants: [{ name: variant, size }]
    };
}


function makeDatastore() {

    return {
        changesNotifications: () => ({ subscribe: () => undefined }),
        deletedNotifications: () => ({ subscribe: () => undefined })
    };
}


async function waitFor(predicate: () => boolean): Promise<void> {

    for (let attempt = 0; attempt < 20; attempt++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    throw new Error('Timed out waiting for condition');
}
