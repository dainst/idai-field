import {Observable} from "rxjs/Observable";
import {Mediastore} from 'idai-components-2/datastore';
import {DomSanitizer} from "@angular/platform-browser";

export class Imagestore implements Mediastore {
	public sani: DomSanitizer = undefined;

	
	public read(key: string): Promise<ArrayBuffer> {
        return new Promise<any>((resolve)=>{resolve();});
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

    public objectChangesNotifications(): Observable<File> {
        return Observable.create( () => {});
    }
}