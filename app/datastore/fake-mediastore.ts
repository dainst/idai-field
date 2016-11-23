import {Observable} from "rxjs/Observable";
import {Mediastore} from 'idai-components-2/datastore';

/**
 * @author Daniel de Oliveira
 */
export class FakeMediastore implements Mediastore {

    public create(): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
    }

    public read(): Promise<any> {
        return new Promise<any>((resolve)=>{resolve();});
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