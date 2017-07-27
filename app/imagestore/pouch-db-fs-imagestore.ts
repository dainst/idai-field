import * as fs from 'fs';
import {BlobMaker} from './blob-maker';
import {Converter} from './converter';
import {M} from '../m';
import {Imagestore} from './imagestore';
import {PouchdbManager} from '../datastore/pouchdb-manager';
import {Inject, Injectable} from '@angular/core';

/**
 * A hybrid image store that uses the file system to store the original images
 * but keeps thumbnails as PouchDB attachments in order to be able to sync them.
 */
@Injectable()
export class PouchDbFsImagestore implements Imagestore {

    private projectName;
    private projectPath = undefined;
    private db = undefined;

    constructor(
        private converter: Converter,
        private blobMaker: BlobMaker,
        @Inject('app.imgPath') private basePath: string,
        pouchdbManager: PouchdbManager) {

        if (this.basePath.substr(-1) != '/') this.basePath += '/';
        if (!fs.existsSync(this.basePath)) fs.mkdirSync(this.basePath);

        this.db = pouchdbManager.getDb();
    }

    public select(projectName: string): void {

        if (this.projectName == projectName) return;

        this.projectName = projectName;
        this.projectPath = this.basePath + projectName + '/';

        if (!fs.existsSync(this.projectPath)) fs.mkdirSync(this.projectPath);
    }

    /**
     * Destroys the project images on the file system
     */
    public destroy(): void {
        if (this.projectPath == undefined) return;
        if (this.projectPath == "") return;
        if (this.projectPath == ".") return;
        if (this.projectPath == "..") return;
        if (this.projectPath == "./") return;
        if (this.projectPath == "/") return;
        if (this.projectPath == "c:\\") return;
        if (this.projectPath == "C:\\") return;

        const deleteFolderRecursive = function(path) {
            if( fs.existsSync(path) ) {
                fs.readdirSync(path).forEach(function(file){
                    const curPath = path + "/" + file;
                    if(!fs.lstatSync(curPath).isDirectory()) {
                        fs.unlinkSync(curPath);
                    }
                });
            }
        };
        deleteFolderRecursive(this.projectPath);
    }

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public create(key: string, data: ArrayBuffer, documentExists: boolean = false): Promise<any> {
        return this.write(key, data, false, documentExists);
    }

    /**
     * Loads an image from the mediastore and generates a blob. Returns an url through which it is accessible.
     * @param key must be an identifier of an existing file in the mediastore.
     * @param sanitizeAfter
     * @param boolean image will be loaded as thumb, default: true
     * @return {Promise<string>} Promise that returns the blob url.
     *  In case of error the promise gets rejected with msgWithParams.
     *  File not found errors are not thrown when an original is requested
     *  (thumb == false) because missing files in the filesystem can be a
     *  normal result of syncing.
     */
    public read(key: string, sanitizeAfter: boolean = false, thumb: boolean = true): Promise<string> {

        let readFun = this.readOriginal.bind(this);
        if (thumb) readFun = this.readThumb.bind(this);
        return readFun(key).then(data => {
            if (data == undefined) {
                console.error('data read was undefined for', key, 'thumbnails was', thumb);
                return Promise.reject([M.IMAGESTORE_ERROR_MEDIASTORE_READ, key]);
            }
            return this.blobMaker.makeBlob(data, sanitizeAfter);
        }).catch(err => {
            // missing file is ok for originals
            if (err.code == 'ENOENT' && !thumb) return Promise.resolve('');
            console.error(err);
            return Promise.reject([M.IMAGESTORE_ERROR_MEDIASTORE_READ, key]);
        });
    }

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public update(key: string, data: ArrayBuffer): Promise<any> {
        return this.write(key, data, true, true);
    }

    /**
     * @param key the identifier for the data to be removed
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
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
                        return reject([M.IMAGESTORE_ERROR_DELETE, key])
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
                    reject([M.IMAGES_ERROR_MEDIASTORE_WRITE, key]);
                }
                else {
                    let blob = this.converter.convert(data);
                    // TODO: remove when tests run with electron
                    // convert to buffer or blob depending on whether we run in node or browser
                    if (typeof Blob !== 'undefined') {
                        blob = new Blob([blob]);
                    } else {
                        blob = Buffer.from(blob);
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
                        reject([M.IMAGES_ERROR_MEDIASTORE_WRITE, key])
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