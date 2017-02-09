import {Observable} from "rxjs/Observable";
import {Http, ResponseContentType} from '@angular/http';
import {Mediastore} from 'idai-components-2/datastore';

/**
 * Read-only datastore for retrieving images from the local mediastore folder via Http
 * @author Sebastian Cuy
 */
export class HttpMediastore implements Mediastore {

    constructor(private http: Http, private basePath: string) {
        if (this.basePath.substr(-1) != '/') this.basePath += '/';
    }

    public create(): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
    }

    public read(key: string): Promise<ArrayBuffer> {
        return new Promise<any>((resolve,reject)=>{
            this.http.get(this.basePath + key, { responseType: ResponseContentType.ArrayBuffer }).subscribe(response => {
                resolve(response.arrayBuffer());
            },error=>reject(error));
        });
    }

    public update(): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
    }

    public remove(): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
    }

    public objectChangesNotifications(): Observable<File> {
        return Observable.create( () => {});
    }
}