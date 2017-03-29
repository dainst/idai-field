import {Http, ResponseContentType} from '@angular/http';
import {AbstractImagestore} from './abstract-imagestore';
import {DomSanitizer} from "@angular/platform-browser";
import {BlobMaker} from "./blob-maker";

/**
 * Read-only datastore for retrieving images from the local mediastore folder via Http
 * @author Sebastian Cuy
 */
export class HttpImagestore extends AbstractImagestore {

    constructor(blobMaker: BlobMaker, private http: Http, private basePath: string) {
        super(blobMaker);
        if (this.basePath.substr(-1) != '/') this.basePath += '/';
    }
  
    protected _read(key: string, thumb: boolean): Promise<ArrayBuffer> {
        let path = thumb ? this.basePath + "/thumbs/" + key : this.basePath + key;

        return new Promise<any>((resolve,reject)=>{
            this.http.get(path, { responseType: ResponseContentType.ArrayBuffer }).subscribe(response => {
                resolve(response.arrayBuffer());
            },error=>reject(error));
        });
    }

    public create(key: string, data: ArrayBuffer): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
    }
    public update(key: string, data: ArrayBuffer): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
    }

    public remove(key: string): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
    }
}