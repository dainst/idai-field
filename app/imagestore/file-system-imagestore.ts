import * as fs from 'fs';
import {BlobMaker} from "./blob-maker";
import {Converter} from "./converter";
import {M} from "../m";
import {Observable} from "rxjs/Observable";

export class FileSystemImagestore {

    private projectName = 'test';
    private projectPath = undefined;

    constructor(
        private converter: Converter,
        private blobMaker: BlobMaker,
        private basePath: string) {

        if (this.basePath.substr(-1) != '/') this.basePath += '/';

    }

    public select(projectName: string): void {
        this.projectName = projectName;
        this.projectPath = this.basePath + projectName + '/';
        console.log("projectpath",this.projectPath);

        if (!fs.existsSync(this.projectPath)) fs.mkdirSync(this.projectPath);
        const thumbs_path = this.projectPath + "thumbs/";
        if (!fs.existsSync(thumbs_path)) fs.mkdirSync(thumbs_path);


        if (projectName == 'test') this.loadSampleData();
    }

    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @returns {Promise<any>} resolve -> (),
     *   reject -> the error message
     */
    public create(key: string, data: ArrayBuffer): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.writeFile(this.projectPath + key, Buffer.from(data), {flag: 'wx'}, (err) => {
                if (err) reject(err);
                else {

                    fs.writeFile(this.projectPath + "thumbs/" + key,
                        this.converter.convert(data), {flag: 'wx'}, (err) => {
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
     * Loads an image from the mediastore and generates a blob. Returns an url through which it is accessible.
     * @param mediastoreFilename must be an identifier of an existing file in the mediastore.
     * @param sanitizeAfter
     * @param boolean image will be loaded as thumb, default: true
     * @return {Promise<string>} Promise that returns the blob url.
     *  In case of error the promise gets rejected with msgWithParams.
     */
    public read(mediastoreFilename:string, sanitizeAfter:boolean = false, thumb:boolean = true): Promise<string> {
        return new Promise((resolve, reject) => {
            this._read(mediastoreFilename, thumb).then(data => {
                if (data == undefined) reject([M.IMAGESTORE_ERROR_MEDIASTORE_READ].concat([mediastoreFilename]));
                resolve(this.blobMaker.makeBlob(data,sanitizeAfter));
            }).catch(() => {
                reject([M.IMAGESTORE_ERROR_MEDIASTORE_READ].concat([mediastoreFilename]));
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
        let path = thumb ? this.projectPath + "/thumbs/" + key : this.projectPath + key;
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
            fs.writeFile(this.projectPath + key, Buffer.from(data), {flag: 'w'}, (err) => {
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
            fs.unlink(this.projectPath + key, (err) => {
                if (err) reject(err);
                else resolve();
            })
        });
    }

    public objectChangesNotifications(): Observable<File> {
        return Observable.create( () => {});
    }


    private loadSampleData(): void {

        const base = "/test/test-data/imagestore-samples/";

        let path = process.cwd() + base;
        if (!fs.existsSync(path)) path = process.resourcesPath + base;
        this.copyFilesOfDir(path, this.projectPath);

        path = process.cwd() + base + 'thumbs/';
        if (!fs.existsSync(path)) path = process.resourcesPath + base + 'thumbs/';
        this.copyFilesOfDir(path, this.projectPath + 'thumbs/');
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