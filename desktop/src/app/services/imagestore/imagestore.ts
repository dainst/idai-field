import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Settings } from '../settings/settings';
import { Filestore } from '../filestore/filestore';
import { ImageConverter } from './image-converter';
import { ImagestoreErrors } from './imagestore-errors';
import { SecurityContext } from '@angular/core';

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

    private originalUrls: { [imageKey: string]: SafeResourceUrl} = {};
    private thumbnailUrls: { [imageKey: string]: SafeResourceUrl} = {};

    constructor(
        private filestore: Filestore,
        private converter: ImageConverter,
        private db: PouchDB.Database,
        private sanitizer: DomSanitizer) {
    }

    public setDb = (db: PouchDB.Database) => this.db = db;

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
        const buffer: Buffer | undefined = await this.converter.convert(data);

        if (!buffer) {
            return 'Failed to create thumbnail for image document ' + imageId;
        }

        const thumnailPath = this.path + '/thumbs/' + imageId;
        this.filestore.writeFile(thumnailPath, buffer);
    }

    /**
     * Returns a URL for the image for the requested image resource. Actually creates a link to in memory
     * image data using {@link URL.createObjectURL}, you may want to call {@link revokeImageUrl} or {@link revokeAllImageUrls}
     * prematurely if you run into memory issues. See also https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL.
     * @param imageId the image's id
     * @param type the imageversion, for possible values see {@link IMAGEVERSION}
     */
     public async getUrl(imageId: string, type: IMAGEVERSION): Promise<SafeResourceUrl> {
        const relevantList = (type === IMAGEVERSION.ORIGINAL) ? this.originalUrls : this.thumbnailUrls;

        if (relevantList[imageId]) {
            return relevantList[imageId];
        }
        const data = await this.readFileSystem(imageId, type);

        relevantList[imageId] = this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(new Blob([data]))
        );

        return relevantList[imageId];
    }

    /**
     * Returns the raw Blob data for the requested images' thumbnails.
     * @param imageIds An array containing the requested images' thumbnails.
     * TODO: Überhaupt noch benötigt von außerhalb?
     */
    public async getThumbnailData(imageIds: string[]): Promise<{ [imageId: string]: Blob }> {
        const result: { [imageId: string]: Blob } = {};
        for (const imageId of imageIds) {
            result[imageId] = await this.readFileSystem(imageId, IMAGEVERSION.THUMBNAIL);
        }
        return result;
    }

    /**
     * Revokes the object URLs for an image created by {@link getUrl}.
     * @param imageId the image's id
     */
    private revokeUrl(imageId: string, type: IMAGEVERSION) {
        const requestedList = (type === IMAGEVERSION.ORIGINAL) ? this.originalUrls : this.thumbnailUrls;
        if (!requestedList[imageId]) return;

        URL.revokeObjectURL(this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, requestedList[imageId]));
        delete requestedList[imageId];
    }


    /**
     * Calls {@link revokeUrl} for all images in the datastore.
     */
    public revokeAllUrls() {

        for (const imageId of Object.keys(this.originalUrls)) {
            this.revokeUrl(imageId, IMAGEVERSION.ORIGINAL);
        }

        for (const imageId of Object.keys(this.originalUrls)) {
            this.revokeUrl(imageId, IMAGEVERSION.THUMBNAIL);
        }
    }

    /**
     * @param key the identifier for the data to be removed
     * @param options
     */
    public async remove(key: string/*,  options?: { fs?: true } TODO review */): Promise<any> {

        this.revokeUrl(key, IMAGEVERSION.ORIGINAL);
        this.revokeUrl(key, IMAGEVERSION.THUMBNAIL);

        // if (options?.fs === true) {
        //     this.filestore.removeFile(this.path + '/' + key)
        //     return;
        // }

        // original file may be missing due to syncing, but then removeFile will do nothing
        this.filestore.removeFile(this.path + '/' + key); 
        this.filestore.removeFile(this.path + '/thumbs/' + key);

        // return new Promise((resolve, reject) => {
        // this.db.get(key)
        // .then((result: any) => result._rev)
        // .then((rev: any) => {
        //
        // })
        // .then(() => resolve(undefined))
        // .catch((err: any) => {
        // console.error(err);
        // console.error(key);
        // return reject([ImagestoreErrors.GENERIC_ERROR])
        // });
        // });
    }

    private async readFileSystem(key: string, type: IMAGEVERSION): Promise<Blob> {
        const relativeImageDirectory = (type === IMAGEVERSION.ORIGINAL) ? '/' : '/thumbs';

        const path = this.path + relativeImageDirectory + '/' + key;
        return this.filestore.readFile(path);
    }
}
