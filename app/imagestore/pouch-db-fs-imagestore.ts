import {Injectable} from '@angular/core';
import * as fs from 'fs';
import {BlobMaker} from './blob-maker';
import {Converter} from './converter';
import {Imagestore} from './imagestore';
import {PouchdbManager} from '../datastore/pouchdb-manager';
import {ImagestoreErrors} from './imagestore-errors';

@Injectable()
/**
 * A hybrid image store that uses the file system to store the original images
 * but keeps thumbnails as PouchDB attachments in order to be able to sync them.
 */
export class PouchDbFsImagestore implements Imagestore {

    private projectPath: string = undefined;
    private db = undefined;

    constructor(
        private converter: Converter,
        private blobMaker: BlobMaker,
        pouchdbManager: PouchdbManager) {

        this.db = pouchdbManager.getDb();
    }

    public getPath(): string {

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

        return readFun(key).then(data => {

            if (data == undefined) {
                console.error('data read was undefined for', key, 'thumbnails was', thumb);
                return Promise.reject([ImagestoreErrors.EMPTY]);
            }
            return this.blobMaker.makeBlob(data, sanitizeAfter);

        }).catch(err => {
            // missing file is ok for originals
            if (err.code == 'ENOENT' && !thumb) return Promise.resolve('');

            return Promise.reject([ImagestoreErrors.NOT_FOUND]);
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
                    .then(result => result._rev)
                    .then(rev => this.db.removeAttachment(key, 'thumb', rev))
                    .then(() => resolve())
                    .catch(err => {
                        console.error(err);
                        console.error(key);
                        return reject([ImagestoreErrors.GENERIC_ERROR])
                    });
            })
        });
    }

    private write(key, data, update, documentExists): Promise<any> {

        let flag = update ? 'w' : 'wx';
        return new Promise((resolve, reject) => {
            fs.writeFile(this.projectPath + key, Buffer.from(data), {flag: flag}, (err) => {
                if (err) {
                    console.error(err);
                    console.error(key);
                    reject([ImagestoreErrors.GENERIC_ERROR]);
                }
                else {
                    const buffer = this.converter.convert(data);

                    let blob;
                    if (typeof Blob !== 'undefined') {
                        blob = new Blob([buffer]);  // electron runtime environment
                    } else {
                        blob = Buffer.from(buffer); // jasmine node tests
                    }

                    let promise;
                    if (documentExists) {
                        promise = this.db.get(key).then(doc => doc._rev);
                    } else {
                        promise = Promise.resolve();
                    }

                    promise.then(rev => {
                        return this.db.putAttachment(key, 'thumb', rev, blob, 'image/jpeg')
                    }).then(() => resolve()
                    ).catch(err => {
                        console.error(err);
                        console.error(key);
                        reject([ImagestoreErrors.GENERIC_ERROR])
                    });
                }
            });
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