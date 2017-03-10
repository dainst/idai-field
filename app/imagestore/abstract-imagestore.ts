import {Observable} from "rxjs/Observable";
import {Imagestore} from './imagestore';
import {DomSanitizer} from "@angular/platform-browser";
import {M} from "../m";
import {BlobMaker} from "./blob-maker";

export abstract class AbstractImagestore implements Imagestore {

    constructor(private blobMaker: BlobMaker) { }

	public sani: DomSanitizer = undefined;

	public abstract create(key: string, data: ArrayBuffer): Promise<any>;

    public abstract update(key: string, data: ArrayBuffer): Promise<any>;

    public abstract remove(key: string): Promise<any>;


    public objectChangesNotifications(): Observable<File> {
        return Observable.create( () => {});
    }

    protected abstract _read(key: string): Promise<ArrayBuffer>;

    /**
     * Loads an image from the mediastore and generates a blob. Returns an url through which it is accessible.
     * @param mediastoreFilename must be an identifier of an existing file in the mediastore.
     * @param sanitizeAfter
     * @return {Promise<string>} Promise that returns the blob url.
     *  In case of error the promise gets rejected with msgWithParams.
     */
    public read(mediastoreFilename:string,sanitizeAfter:boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            this._read(mediastoreFilename).then(data => {
                if (data == undefined) reject([M.IMAGES_ERROR_MEDIASTORE_READ].concat([mediastoreFilename]));
                resolve(this.blobMaker.makeBlob(data,sanitizeAfter));
            }).catch(() => {
                reject([M.IMAGES_ERROR_MEDIASTORE_READ].concat([mediastoreFilename]));
            });
        });
    }
}