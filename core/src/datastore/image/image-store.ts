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

    private projectPath: string | undefined = undefined; // TODO deprecated
    private path: string | undefined = undefined; // expected to have no ending slash

    constructor(
        private filesystem: FilesystemAdapterInterface,
        private converter: ThumbnailGeneratorInterface) {
    }

    public getPath = (): string | undefined => this.projectPath;

    public init(imagestoreRootPath: string, projectName: string): void {
        this.projectPath = imagestoreRootPath + projectName + '/';
        this.path = '/' + projectName;

        if (!this.filesystem.exists(this.path)) {
            this.filesystem.mkdir(this.path);
        }
        if (!this.filesystem.exists(this.path + '/thumbs')) {
            this.filesystem.mkdir(this.path + '/thumbs');
        }
    }


    /**
     * Store data with the provided id.
     * @param imageId the identifier for the data
     * @param data the binary data to be stored
     */
    public store(imageId: string, data: Buffer): void {

        const buffer = Buffer.from(data);
        this.filesystem.writeFile(this.path + '/' + imageId, Buffer.from(buffer));
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
        this.filesystem.removeFile(this.path + '/' + key);
        this.filesystem.removeFile(this.path + '/thumbs/' + key);
    }

    private async readFileSystem(key: string, type: ImageVariant): Promise<Buffer> {
        const relativeImageDirectory = (type === ImageVariant.ORIGINAL) ? '/' : '/thumbs/';

        const path = this.path + relativeImageDirectory + key;


        // TODO: An sich sollten immer die "original thumbnails" gesynct werden, anstatt dass eine Anwendung
        // sie neu generiert weil noch nicht vorhanden?
        if (type === ImageVariant.THUMBNAIL && !this.filesystem.exists(path))
        {
            const originalFilePath = this.path + '/' + key;
            if (this.filesystem.exists(originalFilePath)) {
                await this.createThumbnail(key, this.filesystem.readFile(this.path + '/' + key));
            }
        }

        return this.filesystem.readFile(path);
    }

    private async createThumbnail(key: string, data: Buffer) {

        const buffer = await this.converter.generate(data, THUMBNAIL_TARGET_HEIGHT);
        const thumbnailPath = this.path + '/thumbs/' + key;
        this.filesystem.writeFile(thumbnailPath, buffer);
    }
}
