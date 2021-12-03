import { Settings } from '../settings/settings';
import { Filestore } from '../filestore/filestore';
import { ImageConverter } from './image-converter';
import { ImagestoreErrors } from './imagestore-errors';

export enum IMAGEVERSION {
    ORIGINAL, THUMBNAIL
}


/**
 * An image store that uses the file system to store the original images and
 * thumbnails in order to be able to sync them.
 *
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel De Oliviera
 * @author Simon Hohl
 */
export class Imagestore {

    private projectPath: string | undefined = undefined; // TODO deprecated
    private path: string | undefined = undefined; // expected to have no ending slash

    constructor(
        private filestore: Filestore,
        private converter: ImageConverter) {
    }

    public getPath = (): string | undefined => this.projectPath;

    public init(settings: Settings): Promise<any> {

        return new Promise<any>(resolve => {

            this.projectPath = settings.imagestorePath + settings.selectedProject + '/';
            this.path = '/' + settings.selectedProject;

            if (!this.filestore.fileExists(this.path)) {
                this.filestore.mkdir(this.path, true);
                // reject([ImagestoreErrors.INVALID_PATH]); TODO remove; not longer necessary
            }
            if (!this.filestore.fileExists(this.path + '/thumbs')) {
                this.filestore.mkdir(this.path + '/thumbs');
                // reject([ImagestoreErrors.INVALID_PATH]); TODO remove; not longer necessary
            }

            resolve(undefined);
        });
    }


    /**
     * Store data with the provided id.
     * @param imageId the identifier for the data
     * @param data the binary data to be stored
     */
    public async store(imageId: string, data: ArrayBuffer): Promise<any> {

        this.filestore.writeFile(this.path + '/' + imageId, Buffer.from(data));
        this.createThumbnail(imageId, data);
    }

    /**
     * Returns the raw ArrayBuffer data for the requested images' thumbnails.
     * @param imageId An array containing the requested images' thumbnails.
     */
    public async getData(imageId: string, type: IMAGEVERSION): Promise<ArrayBuffer> {
        return await this.readFileSystem(imageId, type);
    }

    /**
     * @param key the identifier for the data to be removed
     */
    public async remove(key: string): Promise<any> {
        this.filestore.removeFile(this.path + '/' + key);
        this.filestore.removeFile(this.path + '/thumbs/' + key);
    }

    private async readFileSystem(key: string, type: IMAGEVERSION): Promise<ArrayBuffer> {
        const relativeImageDirectory = (type === IMAGEVERSION.ORIGINAL) ? '/' : '/thumbs/';

        const path = this.path + relativeImageDirectory + key;

        if (type === IMAGEVERSION.THUMBNAIL && !this.filestore.fileExists(path))
        {
            const originalFilePath = this.path + '/' + key;
            if (this.filestore.fileExists(originalFilePath)) {
                await this.createThumbnail(key, this.filestore.readFile(this.path + '/' + key));
            }
        }

        return this.filestore.readFile(path);
    }

    private async createThumbnail(key: string, data: ArrayBuffer) {
        const buffer: Buffer | undefined = await this.converter.convert(data);

        const thumbnailPath = this.path + '/thumbs/' + key;
        this.filestore.writeFile(thumbnailPath, buffer);
    }
}
