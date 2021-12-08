import { FilesystemAdapterInterface } from './filesystem-adapter';
import { ThumbnailGeneratorInterface } from './thumbnail-generator';

export enum ImageVariant {
    ORIGINAL, THUMBNAIL
}

export const THUMBNAIL_TARGET_HEIGHT: number = 320;

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
        if (!this.filesystem.exists(this.absolutePath + 'thumbs/')) {
            this.filesystem.mkdir(this.absolutePath + 'thumbs/');
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

    private async readFileSystem(key: string, type: ImageVariant): Promise<Buffer> {
        const relativeImageDirectory = (type === ImageVariant.ORIGINAL) ? '' : 'thumbs/';

        const path = this.absolutePath + relativeImageDirectory + key;


        // TODO: An sich sollten immer die "original thumbnails" gesynct werden, anstatt dass eine Anwendung
        // sie neu generiert weil noch nicht vorhanden?
        if (type === ImageVariant.THUMBNAIL && !this.filesystem.exists(path))
        {
            const originalFilePath = this.absolutePath + key;
            if (this.filesystem.exists(originalFilePath)) {
                await this.createThumbnail(key, this.filesystem.readFile(this.absolutePath + key));
            }
        }

        return this.filesystem.readFile(path);
    }

    private async createThumbnail(key: string, data: Buffer) {

        const buffer = await this.converter.generate(data, THUMBNAIL_TARGET_HEIGHT);
        const thumbnailPath = this.absolutePath + 'thumbs/' + key;
        this.filesystem.writeFile(thumbnailPath, buffer);
    }
}
