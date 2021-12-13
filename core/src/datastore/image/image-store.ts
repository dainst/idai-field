import { FilesystemAdapterInterface } from './filesystem-adapter';
import { ThumbnailGeneratorInterface } from './thumbnail-generator';

export enum ImageVariant {
    ORIGINAL = "original_image", 
    THUMBNAIL = "thumbnail_image"
}

export const THUMBNAIL_TARGET_HEIGHT: number = 320;

export const thumbnailDirectory = 'thumbs/';
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
    private activeProject: string | undefined = undefined;

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
    public init(fileSystemBasePath: string, activeProject: string): void {
        
        this.absolutePath = fileSystemBasePath.endsWith('/') ? fileSystemBasePath : fileSystemBasePath + '/';
        this.activeProject = activeProject;

        if (!this.filesystem.exists(this.absolutePath + activeProject + '/')) {
            this.filesystem.mkdir(this.absolutePath + activeProject + '/', true);
        }
        if (!this.filesystem.exists(this.absolutePath + activeProject + '/' + thumbnailDirectory)) {
            this.filesystem.mkdir(this.absolutePath + activeProject + '/' + thumbnailDirectory);
        }
    }


    /**
     * Store data with the provided id.
     * @param imageId the identifier for the data
     * @param data the binary data to be stored
     */
    public store(imageId: string, data: Buffer, project: string = this.activeProject): void {

        const buffer = Buffer.from(data);
        this.filesystem.writeFile(this.absolutePath + project + '/' + imageId, Buffer.from(buffer));
        this.createThumbnail(imageId, buffer, project);
    }

    /**
     * Returns the raw Buffer data for the requested image.
     * @param imageId the identifier for the image
     * @param type variant type of the image, see {@link ImageVariant}.
     */
    public async getData(imageId: string, type: ImageVariant, project: string = this.activeProject): Promise<Buffer> {
        return await this.readFileSystem(imageId, type, project);
    }

    /**
     * Removes the image from the filesystem and creates an empty tombstone file with
     * the same name plus a {@link tombstoneSuffix}.
     * @param imageId the identifier for the image to be removed
     */
    public async remove(imageId: string, project: string = this.activeProject): Promise<any> {
        this.filesystem.removeFile(
            this.absolutePath + project + '/' + imageId
        );
        this.filesystem.writeFile(
            this.absolutePath + project + '/' + imageId + tombstoneSuffix, Buffer.from([])
        );
        this.filesystem.removeFile(
            this.absolutePath + project + '/' + thumbnailDirectory + imageId
        );
        this.filesystem.writeFile(
            this.absolutePath + project + '/' + thumbnailDirectory + imageId + tombstoneSuffix, Buffer.from([])
        );
    }

    public getFileIds(project: string = this.activeProject, types: ImageVariant[] = []): { [uuid: string]: ImageVariant[]} {
        let originalFileNames = [];
        let thumbnailFileNames = [];

        if(types.length === 0){
            originalFileNames = this.getFileNames(this.absolutePath + project + '/');
            thumbnailFileNames = this.getFileNames(this.absolutePath + project + '/' + thumbnailDirectory);
        } else {
            if(types.includes(ImageVariant.ORIGINAL)){
                originalFileNames = this.getFileNames(this.absolutePath + project + '/');
            } else if(types.includes(ImageVariant.THUMBNAIL)) {
                thumbnailFileNames = this.getFileNames(this.absolutePath + project + '/' + thumbnailDirectory);
            }
        }

        console.log(originalFileNames);
        console.log(thumbnailFileNames);

        const result = {};
        for(const fileName of originalFileNames){
            if(fileName in result) result[fileName].push(ImageVariant.ORIGINAL)
            else result[fileName] = [ImageVariant.ORIGINAL]
        }
        
        for(const fileName of thumbnailFileNames){
            if(fileName in result) result[fileName].push(ImageVariant.THUMBNAIL)
            else result[fileName] = [ImageVariant.THUMBNAIL]
        }

        return result;
    }

    private getFileNames(path: string) {
        return this.filesystem.listFiles(path)
            .map((filePath) => {
                return filePath.slice((path).length)
            });
    }

    public getOriginalFilePaths(project: string = this.activeProject): string[] {
        return this.filesystem.listFiles(this.absolutePath + project + '/')
            .map((path) => {
                return path.slice((this.absolutePath + project + '/').length)
            });
    }

    public getThumbnailFilePaths(project: string = this.activeProject): string[] {
        return this.filesystem.listFiles(this.absolutePath + project + '/' + thumbnailDirectory)
            .map((path) => {
                return path.slice((this.absolutePath + project + '/').length)
            });
    }

    public getAllFilePaths(project: string = this.activeProject): string[]{
        return this.getOriginalFilePaths(project).concat(this.getThumbnailFilePaths(project))
    }

    private async readFileSystem(imageId: string, type: ImageVariant, project: string): Promise<Buffer> {
        const variantDirectory = (type === ImageVariant.ORIGINAL) ? '' : thumbnailDirectory;

        const path = this.absolutePath + project + '/' + variantDirectory + imageId;

        if (type === ImageVariant.THUMBNAIL && !this.filesystem.exists(path))
        {
            const originalFilePath = this.absolutePath + project + '/' + imageId;
            if (this.filesystem.exists(originalFilePath)) {
                await this.createThumbnail(imageId, this.filesystem.readFile(this.absolutePath + project + '/' + imageId), project);
            }
        }

        return this.filesystem.readFile(path);
    }

    private async createThumbnail(imageId: string, data: Buffer, project: string) {

        const buffer = await this.converter.generate(data, THUMBNAIL_TARGET_HEIGHT);
        const thumbnailPath = this.absolutePath + project + '/' + thumbnailDirectory + imageId;
        this.filesystem.writeFile(thumbnailPath, buffer);
    }
}
