import {Injectable} from '@angular/core';
import * as fs from 'fs';
import {BlobMaker} from './blob-maker';
import {Converter} from './converter';
import {Imagestore} from './imagestore';
import {PouchdbManager} from '../datastore/core/pouchdb-manager';
import {ImagestoreErrors} from './imagestore-errors';


@Injectable()
/**
 * A hybrid image store that uses the file system to store the original images
 * but keeps thumbnails as PouchDB attachments in order to be able to sync them.
 */
export class PouchDbFsImagestore implements Imagestore {

    private projectPath: string|undefined = undefined;
    private db: any = undefined;


    constructor(
        private converter: Converter,
        private blobMaker: BlobMaker,
        pouchdbManager: PouchdbManager) {

        this.db = pouchdbManager.getDb();
    }

    
    public getPath(): string|undefined {

        return this.projectPath;
    }

    
    public setPath(imagestorePath: string, projectName: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            if (!fs.existsSync(imagestorePath)) {
                try {
                    fs.mkdirSync(imagestorePath);
                } catch(error) {
                    this.projectPath = undefined;
                    return reject([ImagestoreErrors.INVALID_PATH]);
                }
            }

            this.projectPath = imagestorePath + projectName + '/';

            if (!fs.existsSync(this.projectPath)) {
                try {
                    fs.mkdirSync(this.projectPath);
                } catch(error) {
                    this.projectPath = undefined;
                    return reject([ImagestoreErrors.INVALID_PATH]);
                }
            }

            resolve();
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
     * @param thumb image will be loaded as thumb, default: true
     *
     *   File not found errors are not thrown when an original is requested
     *   (thumb == false) because missing files in the filesystem can be a
     *   normal result of syncing.
     */
    public read(key: string, sanitizeAfter: boolean = false, thumb: boolean = true): Promise<string> {

        let readFun = this.readOriginal.bind(this);
        if (thumb) readFun = this.readThumb.bind(this);

        return readFun(key).then((data: any) => {

            if (data == undefined) {
                console.error('data read was undefined for', key, 'thumbnails was', thumb);
                return Promise.reject([ImagestoreErrors.EMPTY]);
            }

            if (thumb && data.size == 2) return Promise.reject('thumb broken');

            return this.blobMaker.makeBlob(data, sanitizeAfter);

        }).catch((err: any) => {

            // missing file is ok for originals
            // if (err.code == 'ENOENT' && !thumb) return Promise.resolve(''); // code before temp fix was added
            if (!thumb) return Promise.resolve('');

            // return Promise.reject([ImagestoreErrors.NOT_FOUND]); // code before temp fix was added

            // temporary fix
            // if thumb and original present then recreate thumb
            return this.readOriginal(key).then((data: any) => {

                console.debug('recreate thumb');
                return this.putAttachment(data, key, true)
                    .then(() => this.read(key, sanitizeAfter));

            }).catch((err: any) => {
                return Promise.reject([ImagestoreErrors.NOT_FOUND]); // both thumb and original
            });
        });
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
     */
    public remove(key: string): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.unlink(this.projectPath + key, () => {
                // errors are ignored on purpose, original file may be missing due to syncing
                this.db.get(key)
                    .then((result: any) => result._rev)
                    .then((rev: any) => this.db.removeAttachment(key, 'thumb', rev))
                    .then(() => resolve())
                    .catch((err: any) => {
                        console.error(err);
                        console.error(key);
                        return reject([ImagestoreErrors.GENERIC_ERROR])
                    });
            })
        });
    }


    private write(key: any, data: any, update: any, documentExists: any): Promise<any> {

        let flag = update ? 'w' : 'wx';
        return new Promise((resolve, reject) => {
            fs.writeFile(this.projectPath + key, Buffer.from(data), {flag: flag}, (err) => {
                if (err) {
                    console.error(err);
                    console.error(key);
                    reject([ImagestoreErrors.GENERIC_ERROR]);
                }
                else {

                    this.putAttachment(data, key, documentExists)
                        .then(() => resolve()
                    ).catch((err: any) => {
                        console.error(err);
                        console.error(key);
                        reject([ImagestoreErrors.GENERIC_ERROR])
                    });
                }
            });
        });
    }


    private putAttachment(data: any, key: any, documentExists: boolean) {

        const buffer = this.converter.convert(data);

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
            return this.db.putAttachment(key, 'thumb', rev, blob, 'image/jpeg')
        });
    }

    
    private readOriginal(key: string): Promise<ArrayBuffer> {

        let path = this.projectPath + key;
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }


    private readThumb(key: string): Promise<ArrayBuffer> {

        return this.db.getAttachment(key, 'thumb');
    }
}