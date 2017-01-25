import {Observable} from "rxjs/Observable";
import {Mediastore} from 'idai-components-2/datastore';

import * as fs from '@node/fs';

export class FileSystemMediastore implements Mediastore {

    constructor(private basePath: string) { }

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
                else resolve();
            });
        });
    }

    /**
     * @param key the identifier for the data
     * @returns {Promise<any>} resolve -> (data), the data read with the key,
     *  reject -> the error message
     */
    public read(key: string): Promise<ArrayBuffer> {

        return new Promise((resolve, reject) => {
            fs.readFile(this.basePath + key, (err, data) => {
                if (err) reject(err);
                else {
                    resolve(data);
                }
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

    /**
     * Subscription enables clients to get notified
     * when files get modified via one of the accessor
     * methods defined here.
     */
    public objectChangesNotifications(): Observable<File> {
        return new Observable();
    }

}