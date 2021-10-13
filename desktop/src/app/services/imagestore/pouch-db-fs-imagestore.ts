import { SafeResourceUrl } from '@angular/platform-browser';
import { to } from 'tsfun';
import { Settings } from '../settings/settings';
import { BlobMaker, BlobUrlSet } from './blob-maker';
import { Filestore } from '../filestore/filestore';
import { ImageConverter } from './image-converter';
import { ImagestoreErrors } from './imagestore-errors';


/**
 * A hybrid image store that uses the file system to store the original images
 * but keeps thumbnails as PouchDB attachments in order to be able to sync them.
 *
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PouchDbFsImagestore /* implements Imagestore */{

    private projectPath: string|undefined = undefined; // TODO deprecated
    private path: string|undefined = undefined; // expected to have no ending slash

    private thumbBlobUrls: { [key: string]: BlobUrlSet } = {};
    private originalBlobUrls: { [key: string]: BlobUrlSet } = {};


    constructor(
        private filestore: Filestore,
        private converter: ImageConverter,
        private blobMaker: BlobMaker,
        private db: PouchDB.Database) {
    }

    public setDb = (db: PouchDB.Database) => this.db = db;

    public getPath = (): string|undefined => this.projectPath;

    public init(settings: Settings): Promise<any> {

        return new Promise<any>(resolve => {

            this.projectPath = settings.imagestorePath + settings.selectedProject + '/';
            this.path = '/' + settings.selectedProject;

            if (!this.filestore.fileExists(this.path)) {
                this.filestore.mkdir(this.path);
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

            // if (asThumb && this.isThumbBroken(data)) return Promise.reject('thumb broken'); // Can't happen any longer. What can happen, though, is that the original is missing

            blobUrls[key] = this.blobMaker.makeBlob(data);

            return PouchDbFsImagestore.getUrl(blobUrls[key], sanitizeAfter);

        }).catch((err: any) => {

            if (!asThumb) return Promise.resolve(''); // handle missing files by showing black placeholder
            // return Promise.reject([ImagestoreErrors.NOT_FOUND]); // if both thumb and original missing
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
            result[imageDocument.resource.id] =
                await this.readThumb(imageDocument.resource.id)
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
            this.filestore.removeFile(this.path + '/' + key)
            return;
        }

        this.filestore.removeFile(this.path + '/' + key); // original file may be missing due to syncing, but then removeFile will do nothing
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


    private async write(key: any, data: any, update: any, documentExists: any): Promise<any> {

        // let flag = update ? 'w' : 'wx';

        this.filestore.writeFile(this.path + '/' + key, Buffer.from(data));

            // fs.writeFile(this.projectPath + key, Buffer.from(data), { flag: flag }, err => {
                // if (err) {
                    // console.error(err);
                    // console.error(key);
                    // reject([ImagestoreErrors.GENERIC_ERROR]);
                // }
                // else {
        await this.putAttachment(data, key, documentExists)
                // .then(() => resolve(undefined)
            // ).catch((warning: any) => {
                // console.warn(warning);
                // resolve(undefined);
            // });
            // }
            // });
    }


    private async putAttachment(data: any, key: any, documentExists: boolean) {

        const buffer: Buffer|undefined = await this.converter.convert(data);

        if (!buffer) {
            return Promise.reject('Failed to create thumbnail for image document ' + key);
        }

        let promise;
        if (documentExists) {
            promise = this.db.get(key).then((doc: any) => doc._rev);
        } else {
            promise = Promise.resolve();
        }

        return promise.then((_rev: any) => {

            const path = this.path + '/thumbs/' + key;
            this.filestore.writeFile(path, buffer);
        });
    }


    private async readOriginal(key: string): Promise<any> {

        const path = this.path + '/' + key;
        return this.filestore.readFile(path);
    }


    private async readThumb(key: string): Promise<any> {

        const path = this.path + '/thumbs/' + key;
        return this.filestore.readFile(path);
    }


    private static getUrl(blobUrlSet: BlobUrlSet, sanitizeAfter: boolean = false): string | SafeResourceUrl {

        return sanitizeAfter ? blobUrlSet.sanitizedSafeResourceUrl : blobUrlSet.safeResourceUrl;
    }
}
