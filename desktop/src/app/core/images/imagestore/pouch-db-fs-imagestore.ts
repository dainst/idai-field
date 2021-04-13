import { SafeResourceUrl } from '@angular/platform-browser';
import { to } from 'tsfun';
import { Settings } from '../../settings/settings';
import { BlobMaker, BlobUrlSet } from './blob-maker';
import { ImageConverter } from './image-converter';
import { ImagestoreErrors } from './imagestore-errors';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * A hybrid image store that uses the file system to store the original images
 * but keeps thumbnails as PouchDB attachments in order to be able to sync them.
 *
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PouchDbFsImagestore /* implements Imagestore */{

    private projectPath: string|undefined = undefined;

    private thumbBlobUrls: { [key: string]: BlobUrlSet } = {};
    private originalBlobUrls: { [key: string]: BlobUrlSet } = {};


    constructor(
        private converter: ImageConverter,
        private blobMaker: BlobMaker,
        private db: PouchDB.Database) {
    }

    public setDb = (db: PouchDB.Database) => this.db = db;

    public getPath = (): string|undefined => this.projectPath;

    /**  necessary to detect broken thumbs after restoring backup */
    public isThumbBroken = (data: Blob|any|undefined) => data === undefined || data.size == 0 || data.size == 2;


    public init(settings: Settings): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            if (!fs.existsSync(settings.imagestorePath)) {
                try {
                    fs.mkdirSync(settings.imagestorePath);
                } catch(error) {
                    this.projectPath = undefined;
                    return reject([ImagestoreErrors.INVALID_PATH]);
                }
            }

            this.projectPath = settings.imagestorePath + settings.selectedProject + '/';

            if (!fs.existsSync(this.projectPath)) {
                try {
                    fs.mkdirSync(this.projectPath);
                } catch(error) {
                    this.projectPath = undefined;
                    return reject([ImagestoreErrors.INVALID_PATH]);
                }
            }

            resolve(undefined);
        });
    }


    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @param documentExists
     */
    public create(key: string, data: ArrayBuffer, documentExists: boolean = false): Promise<any> {

        return this.write(key, data, false, documentExists);
    }


    /**
     * Implements {@link ReadImagestore#read}
     *
     * @param key
     * @param sanitizeAfter
     * @param asThumb image will be loaded as thumb, default: true
     *
     *   File not found errors are not thrown when an original is requested
     *   (thumb == false) because missing files in the filesystem can be a
     *   normal result of syncing.
     */
    public read(key: string, sanitizeAfter: boolean = false,
                asThumb: boolean = true): Promise<string|SafeResourceUrl> {

        const readFun = asThumb ? this.readThumb.bind(this) : this.readOriginal.bind(this);
        const blobUrls = asThumb ? this.thumbBlobUrls : this.originalBlobUrls;

        if (blobUrls[key]) return Promise.resolve(PouchDbFsImagestore.getUrl(blobUrls[key], sanitizeAfter));

        return readFun(key).then((data: any) => {

            if (data == undefined) {
                console.error('data read was undefined for', key, 'thumbnails was', asThumb);
                return Promise.reject([ImagestoreErrors.EMPTY]);
            }

            if (asThumb && this.isThumbBroken(data)) return Promise.reject('thumb broken');

            blobUrls[key] = this.blobMaker.makeBlob(data);

            return PouchDbFsImagestore.getUrl(blobUrls[key], sanitizeAfter);

        }).catch((err: any) => {

            if (!asThumb) return Promise.resolve(''); // handle missing files by showing black placeholder

            return this.createThumbnail(key).then(() => this.read(key, sanitizeAfter))
                .catch(() => {
                    return Promise.reject([ImagestoreErrors.NOT_FOUND]); // both thumb and original
                });
        });
    }


    public async readThumbnails(imageIds: string[]): Promise<{ [imageId: string]: Blob }> {

        const options = {
            keys: imageIds,
            include_docs: true,
            attachments: true,
            binary: true
        };

        const imageDocuments = (await this.db.allDocs(options)).rows.map(to('doc'));

        const result: { [imageId: string]: Blob } = {};

        for (let imageDocument of imageDocuments) {
            if (imageDocument._attachments?.thumb && !this.isThumbBroken(imageDocument._attachments.thumb.data)) {

                result[imageDocument.resource.id] = imageDocument._attachments.thumb.data;

            } else {
                try {
                    await this.createThumbnail(imageDocument.resource.id);
                    result[imageDocument.resource.id] = await this.readThumb(imageDocument.resource.id);
                } catch(err) {
                    console.error('Failed to recreate thumbnail for image: ' + imageDocument.resource.id, err);
                }
            }
        }

        return result;
    }


    public revoke(key: string, thumb: boolean) {

        const blobUrls = thumb ? this.thumbBlobUrls : this.originalBlobUrls;

        if (!blobUrls[key]) return;

        BlobMaker.revokeBlob(blobUrls[key].url);
        delete blobUrls[key];
    }


    public revokeAll() {

        for (let key of Object.keys(this.originalBlobUrls)) {
            this.revoke(key, false);
        }

        for (let key of Object.keys(this.thumbBlobUrls)) {
            this.revoke(key, true);
        }
    }


    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     */
    public update(key: string, data: ArrayBuffer): Promise<any> {

        return this.write(key, data, true, true);
    }


    /**
     * @param key the identifier for the data to be removed
     * @param options
     */
    public async remove(key: string, options?: { fs?: true } /* TODO review */): Promise<any> {

        if (options?.fs === true) {
            if (fs.existsSync(this.projectPath + key)) {
                fs.unlinkSync(this.projectPath + key);
            }
            return;
        }

        return new Promise((resolve, reject) => {
            fs.unlink(this.projectPath + key, () => {
                // errors are ignored on purpose, original file may be missing due to syncing
                this.db.get(key)
                    .then((result: any) => result._rev)
                    .then((rev: any) => this.db.removeAttachment(key, 'thumb', rev))
                    .then(() => resolve(undefined))
                    .catch((err: any) => {
                        console.error(err);
                        console.error(key);
                        return reject([ImagestoreErrors.GENERIC_ERROR])
                    });
            });
        });
    }


    private write(key: any, data: any, update: any, documentExists: any): Promise<any> {

        let flag = update ? 'w' : 'wx';

        return new Promise((resolve, reject) => {
            fs.writeFile(this.projectPath + key, Buffer.from(data), { flag: flag }, err => {
                if (err) {
                    console.error(err);
                    console.error(key);
                    reject([ImagestoreErrors.GENERIC_ERROR]);
                }
                else {
                    this.putAttachment(data, key, documentExists)
                        .then(() => resolve(undefined)
                    ).catch((warning: any) => {
                        console.warn(warning);
                        resolve(undefined);
                    });
                }
            });
        });
    }


    private async putAttachment(data: any, key: any, documentExists: boolean) {

        const buffer: Buffer|undefined = await this.converter.convert(data);

        if (!buffer) {
            return Promise.reject('Failed to create thumbnail for image document ' + key);
        }

        let blob: any;
        if (typeof Blob !== 'undefined') {
            blob = new Blob([buffer]);  // electron runtime environment
        } else {
            blob = Buffer.from(buffer); // jasmine node tests
        }

        let promise;
        if (documentExists) {
            promise = this.db.get(key).then((doc: any) => doc._rev);
        } else {
            promise = Promise.resolve();
        }

        return promise.then((rev: any) => {
            return this.db.putAttachment(key, 'thumb', rev, blob, 'image/jpeg');
        });
    }


    private readOriginal(key: string): Promise<any> {

        let path = this.projectPath + key;
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }


    private readThumb(key: string): Promise<Blob> {

        return this.db.getAttachment(key, 'thumb') as Promise<Blob>;
    }


    private async createThumbnail(key: string): Promise<any> {

        console.debug('Recreating thumbnail for image:', key);

        const originalImageData = await this.readOriginal(key);
        return await this.putAttachment(originalImageData, key, true);
    }


    private static getUrl(blobUrlSet: BlobUrlSet, sanitizeAfter: boolean = false): string | SafeResourceUrl {

        return sanitizeAfter ? blobUrlSet.sanitizedSafeResourceUrl : blobUrlSet.safeResourceUrl;
    }
}
