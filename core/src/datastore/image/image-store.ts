import { FilesystemAdapterInterface } from './filesystem-adapter';
import { ThumbnailGeneratorInterface } from './thumbnail-generator';

export enum ImageVariant {
    ORIGINAL, THUMBNAIL
}

export const THUMBNAIL_TARGET_HEIGHT: number = 320;

const thumbnailDirectory = 'thumbs/';
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

    private absolutePath: string | undefined = undefined;

    constructor(
        private filesystem: FilesystemAdapterInterface,
        private converter: ThumbnailGeneratorInterface) {
    }

    public getPath = (): string | undefined => this.absolutePath;

    public init(fileSystemBasePath: string): void {

        this.absolutePath = fileSystemBasePath.endsWith('/') ? fileSystemBasePath : fileSystemBasePath + '/';

        if (!this.filesystem.exists(this.absolutePath)) {
            this.filesystem.mkdir(this.absolutePath);
        }
        if (!this.filesystem.exists(this.absolutePath + thumbnailDirectory)) {
            this.filesystem.mkdir(this.absolutePath + thumbnailDirectory);
        }
    }


    /**
     * Store data with the provided id.
     * @param imageId the identifier for the data
     * @param data the binary data to be stored
     */
    public store(imageId: string, data: Buffer): void {

        const buffer = Buffer.from(data);
        this.filesystem.writeFile(this.absolutePath + imageId, Buffer.from(buffer));
        this.createThumbnail(imageId, buffer);
    }

    /**
     * Returns the raw ArrayBuffer data for the requested images' thumbnails.
     * @param imageId An array containing the requested images' thumbnails.
     */
    public async getData(imageId: string, type: ImageVariant): Promise<Buffer> {
        return await this.readFileSystem(imageId, type);
    }

    /**
     * @param key the identifier for the data to be removed
     */
    public async remove(key: string): Promise<any> {
        // TODO: Write tombstones
        this.filesystem.removeFile(this.absolutePath + key);
        this.filesystem.removeFile(this.absolutePath + 'thumbs/' + key);
    }

    private async readFileSystem(imageId: string, type: ImageVariant): Promise<Buffer> {
        const variantDirectory = (type === ImageVariant.ORIGINAL) ? '' : thumbnailDirectory;

        const path = this.absolutePath + variantDirectory + imageId;

        if (type === ImageVariant.THUMBNAIL && !this.filesystem.exists(path))
        {
            const originalFilePath = this.absolutePath + imageId;
            if (this.filesystem.exists(originalFilePath)) {
                await this.createThumbnail(imageId, this.filesystem.readFile(this.absolutePath + imageId));
            }
        }

        return this.filesystem.readFile(path);
    }

    private async createThumbnail(imageId: string, data: Buffer) {

        const buffer = await this.converter.generate(data, THUMBNAIL_TARGET_HEIGHT);
        const thumbnailPath = this.absolutePath + thumbnailDirectory + imageId;
        this.filesystem.writeFile(thumbnailPath, buffer);
    }
}
