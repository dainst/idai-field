import { FilesystemAdapterInterface } from './filesystem-adapter-interface';
import { ThumbnailGeneratorInterface } from './thumbnail-generator-interface';

export enum ImageVariant {
    ORIGINAL = "original_image", 
    THUMBNAIL = "thumbnail_image"
}

export const THUMBNAIL_TARGET_HEIGHT: number = 320;

export const thumbnailDirectory = 'thumbs/';
export const tombstoneSuffix = '.deleted';

/**
 * An image store that uses the file system to store the original images and
 * thumbnails in order to be able to sync them.
 *
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel De Oliviera
 * @author Simon Hohl
 */
export class ImageStore {

    private absolutePath: string | undefined = undefined;
    private activeProject: string | undefined = undefined;

    constructor(
        private filesystem: FilesystemAdapterInterface,
        private converter: ThumbnailGeneratorInterface) {
    }

    public getAbsoluteRootPath = (): string | undefined => this.absolutePath;
    public getActiveProject = (): string | undefined => this.activeProject;

    /**
     * Initializiation function.
     * @param fileSystemBasePath The base path for the project's image store. Will be used to construct absolute 
     * paths for the injected {@link FilesystemAdapterInterface} implementation.
     * @param activeProject the application's active project, will be used as the default project parameter for other functions.
     */
    public init(fileSystemBasePath: string, activeProject: string): void {
        
        this.absolutePath = fileSystemBasePath.endsWith('/') ? fileSystemBasePath : fileSystemBasePath + '/';
        this.activeProject = activeProject;

        const originalsPath = this.getDirectoryPath(activeProject, ImageVariant.ORIGINAL)
        if (!this.filesystem.exists(originalsPath)) {
            this.filesystem.mkdir(originalsPath, true);
        }

        const thumbnailsPath = this.getDirectoryPath(activeProject, ImageVariant.THUMBNAIL);
        if (!this.filesystem.exists(thumbnailsPath)) {
            this.filesystem.mkdir(thumbnailsPath, true);
        }
    }


    /**
     * Store data with the provided id.
     * @param uuid the identifier for the data
     * @param data the binary data to be stored
     * @param project (optional) the project's name, will default to the application's current active project
     * @param type (optional) image's type, will default to {@link ImageVariant.ORIGINAL}.
     */
    public async store(uuid: string, data: Buffer, project: string = this.activeProject, type: ImageVariant = ImageVariant.ORIGINAL) {

        const filePath = this.getFilePath(project, type, uuid);

        this.filesystem.writeFile(filePath, data);

        if (type === ImageVariant.ORIGINAL) {
            await this.createThumbnail(uuid, data, project);
        }
    }

    /**
     * Returns the raw Buffer data for the requested image.
     * @param uuid the identifier for the image
     * @param type variant type of the image, see {@link ImageVariant}.
     * @param project (optional) the project's name, will default to the application's current active project
     */
    public async getData(uuid: string, type: ImageVariant, project: string = this.activeProject): Promise<Buffer> {
        return await this.readFileSystem(uuid, type, project);
    }

    /**
     * Removes the image from the filesystem and creates an empty tombstone file with
     * the same name plus a {@link tombstoneSuffix}.
     * @param uuid the identifier for the image to be removed
     * @param project (optional) the project's name, will default to the application's current active project
     */
    public async remove(uuid: string, project: string = this.activeProject): Promise<any> {
        this.filesystem.remove(
            this.getFilePath(project, ImageVariant.ORIGINAL, uuid)
        );
        this.filesystem.writeFile(
            this.getFilePath(project, ImageVariant.ORIGINAL, uuid) + tombstoneSuffix, Buffer.from([])
        );
        this.filesystem.remove(
            this.getFilePath(project, ImageVariant.THUMBNAIL, uuid)
        );
        this.filesystem.writeFile(
            this.getFilePath(project, ImageVariant.THUMBNAIL, uuid) + tombstoneSuffix, Buffer.from([])
        );
    }


    /**
     * Remove the image store data for the given project.
     * @param project the project's name
     */
    public deleteData(project: string) {
        this.filesystem.remove(this.getDirectoryPath(project), true);
    }

    
    /**
     * Returns all known images and lists their available variants in a project.
     * @param project the project's name
     * @param types List of variants one wants returned. If an empty list is provided, all images no matter which variants
     * are returned, otherwise only images with the requested variants are returned.
     * @returns Dictionary where each key represents an image UUID and each value is a list of the image's known variants.
     */
    public getFileIds(project: string, types: ImageVariant[] = []): { [uuid: string]: ImageVariant[]} {

        let originalFileNames = [];
        let thumbnailFileNames = [];

        if(types.length === 0){
            originalFileNames = this.getFileNames(this.getDirectoryPath(project, ImageVariant.ORIGINAL));
            thumbnailFileNames = this.getFileNames(this.getDirectoryPath(project, ImageVariant.THUMBNAIL));
        } else {
            if(types.includes(ImageVariant.ORIGINAL)){
                originalFileNames = this.getFileNames(this.getDirectoryPath(project, ImageVariant.ORIGINAL));
            } else if(types.includes(ImageVariant.THUMBNAIL)) {
                thumbnailFileNames = this.getFileNames(this.getDirectoryPath(project, ImageVariant.THUMBNAIL));
            }
        }

        const result = {};
        for(const fileName of originalFileNames){
            if(fileName in result) result[fileName].types.push(ImageVariant.ORIGINAL)
            else result[fileName] = {types: [ImageVariant.ORIGINAL]}
        }
        
        for(const fileName of thumbnailFileNames){
            if(fileName in result) result[fileName].types.push(ImageVariant.THUMBNAIL)
            else result[fileName] = {types: [ImageVariant.THUMBNAIL]}
        }

        for(const uuid in result) {
            if(uuid.endsWith(tombstoneSuffix)) {
                const uuidWithoutSuffix = uuid.replace(tombstoneSuffix, "");
                result[uuidWithoutSuffix] = result[uuid];
                result[uuidWithoutSuffix].deleted = true;
                delete result[uuid];
            } else {
                result[uuid].deleted = false;
            }
        }

        return result;
    }

    private getFileNames(path: string) {

        return this.filesystem.listFiles(path)
            .map((filePath) => {
                return filePath.slice((path).length)
            });
    }


    private async readFileSystem(imageId: string, type: ImageVariant, project: string): Promise<Buffer> {

        const path = this.getFilePath(project, type, imageId);

        if (type === ImageVariant.THUMBNAIL && !this.filesystem.exists(path))
        {
            const originalFilePath = this.getFilePath(project, ImageVariant.ORIGINAL, imageId);
            if (this.filesystem.exists(originalFilePath)) {
                await this.createThumbnail(imageId, this.filesystem.readFile(originalFilePath), project);
            }
        }

        return this.filesystem.readFile(path);
    }

    private async createThumbnail(imageId: string, data: Buffer, project: string) {

        const buffer = await this.converter.generate(data, THUMBNAIL_TARGET_HEIGHT);
        const thumbnailPath = this.getFilePath(project, ImageVariant.THUMBNAIL, imageId);
        this.filesystem.writeFile(thumbnailPath, buffer);
    }

    private getDirectoryPath(project: string, type?: ImageVariant) {
        if (type === undefined || type === ImageVariant.ORIGINAL) {
            return this.absolutePath + project + '/';
        } else {
            return this.absolutePath + project + '/' + thumbnailDirectory;
        }
    }

    private getFilePath(project: string, type: ImageVariant, uuid: string) {
        return this.getDirectoryPath(project, type) + uuid;
    }
}
