import {Http, ResponseContentType} from '@angular/http';
import {AbstractImagestore} from './abstract-imagestore';
import {DomSanitizer} from "@angular/platform-browser";

/**
 * Read-only datastore for retrieving images from the local mediastore folder via Http
 * @author Sebastian Cuy
 */
export class HttpImagestore extends AbstractImagestore {

    constructor(private http: Http, private basePath: string) {
        super();
        if (this.basePath.substr(-1) != '/') this.basePath += '/';
    }
  
    public read(key: string): Promise<ArrayBuffer> {
        return new Promise<any>((resolve,reject)=>{
            this.http.get(this.basePath + key, { responseType: ResponseContentType.ArrayBuffer }).subscribe(response => {
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