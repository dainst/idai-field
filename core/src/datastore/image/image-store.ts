import { FilesystemAdapterInterface } from './filesystem-adapter';
import { ThumbnailGeneratorInterface } from './thumbnail-generator';

export enum ImageVariant {
    ORIGINAL, THUMBNAIL
}

export const THUMBNAIL_TARGET_HEIGHT: number = 320;

const thumbnailDirectory = 'thumbs/';
const tombstoneSuffix = '.deleted';

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

    /**
     * Initializiation function.
     * @param fileSystemBasePath The base path for the project's image store. Will be used to construct absolute 
     * paths for the injected {@link FilesystemAdapterInterface} implementation.
     */
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
     * Returns the raw Buffer data for the requested image.
     * @param imageId the identifier for the image
     * @param type variant type of the image, see {@link ImageVariant}.
     */
    public async getData(imageId: string, type: ImageVariant): Promise<Buffer> {
        return await this.readFileSystem(imageId, type);
    }

    /**
     * Removes the image from the filesystem and creates an empty tombstone file with
     * the same name plus a {@link tombstoneSuffix}.
     * @param imageId the identifier for the image to be removed
     */
    public async remove(imageId: string): Promise<any> {
        this.filesystem.removeFile(
            this.absolutePath + imageId
        );
        this.filesystem.writeFile(
            this.absolutePath + imageId + tombstoneSuffix, Buffer.from([])
        );
        this.filesystem.removeFile(
            this.absolutePath + thumbnailDirectory + imageId
        );
        this.filesystem.writeFile(
            this.absolutePath + thumbnailDirectory + imageId + tombstoneSuffix, Buffer.from([])
        );
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
