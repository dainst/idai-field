import {AbstractImagestore} from './abstract-imagestore';

import * as fs from 'fs';
import {BlobMaker} from "./blob-maker";
import {nativeImage} from '../desktop/electron';

export class FileSystemImagestore extends AbstractImagestore {

    constructor(blobMaker: BlobMaker, private basePath: string, loadSampleData: boolean) {
        super(blobMaker);
        if (this.basePath.substr(-1) != '/') this.basePath += '/';
        if (!fs.existsSync(this.basePath)) fs.mkdirSync(this.basePath);
        let thumbs_path = this.basePath + "thumbs/";
        if (!fs.existsSync(thumbs_path)) fs.mkdirSync(thumbs_path);
        if (loadSampleData) this.loadSampleData();
    }

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public create(key: string, data: ArrayBuffer): Promise<any> {

        return new Promise((resolve, reject) => {

            fs.writeFile(this.basePath + key, Buffer.from(data), {flag: 'wx'}, (err) => {
                if (err) reject(err);
                else {
                    let img = nativeImage.createFromBuffer(Buffer.from(data));
                    img =  img.resize({height: 320});
                    fs.writeFile(this.basePath + "thumbs/" + key, img.toJPEG(60), {flag: 'wx'}, (err) => {
                        if (err) reject(err);
                        else {
                            resolve();
                        }
                    });
                }
            });
        });
    }

    /**
     * @param key the identifier for the data
     * @param boolean image will be loaded as thumb, default: true
     * @returns {Promise<any>} resolve -> (data), the data read with the key,
     *  reject -> the error message
     */
    protected _read(key: string, thumb: boolean): Promise<ArrayBuffer> {
        let path = thumb ? this.basePath + "/thumbs/" + key : this.basePath + key;
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public update(key: string, data: ArrayBuffer): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.writeFile(this.basePath + key, Buffer.from(data), {flag: 'w'}, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * @param key the identifier for the data to be removed
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public remove(key: string): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.unlink(this.basePath + key, (err) => {
                if (err) reject(err);
                else resolve();
            })
        });
    }


    private loadSampleData(): void {

        let path = process.cwd() + '/imagestore/';
        if (!fs.existsSync(path)) path = process.resourcesPath + '/imagestore/';
        this.copyFilesOfDir(path, this.basePath);

        path = process.cwd() + '/imagestore/thumbs/';
        if (!fs.existsSync(path)) path = process.resourcesPath + '/imagestore/thumbs/';
        this.copyFilesOfDir(path, this.basePath + 'thumbs/');


    }

    private copyFilesOfDir (path, dest):void {
        fs.readdir(path, (err, files) => {
            files.forEach(file => {
                if(!fs.statSync(path + file).isDirectory()) {
                    fs.createReadStream(path + file).pipe(fs.createWriteStream(dest + file));
                }
            });
            console.debug("Successfully put samples from " + path + " to " + dest );
        });
    }
}