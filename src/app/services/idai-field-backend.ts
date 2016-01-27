import {Injectable, Inject} from "angular2/core";
import {Http} from "angular2/http";
import {IdaiFieldObject} from "../model/idai-field-object";
import {ModelUtils} from '../model/model-utils';
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Response} from "angular2/http";

/**
 * @author Jan G. Wieners
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class IdaiFieldBackend {

    private typeName  : string = "objects";
    private hostUrl   : string;
    private indexName : string;
    private connected : boolean;
    private connectionCheckTimer: number;
    private observers: Observer<boolean>[] = [];

    public constructor(private http: Http,
        @Inject('app.config') private config) {
        this.checkConnection();
    }

    public setHostName(hostName: string) {
        this.hostUrl = hostName;
    }

    public setIndexName(indexName:string):void {
        this.indexName= indexName;
    }

    public isConnected(): Observable<boolean> {
        return Observable.create( observer => {
            this.observers.push(observer);
            observer.next(false);
        });
    }

    public checkConnection(): void {

        this.http.get(this.hostUrl + '/idaifield')
        .subscribe(
            data => this.setConnectionStatus(true),
            err => this.setConnectionStatus(false)
        );
    }

    private setConnectionStatus(connected: boolean) {

        if (connected != this.connected) {
            this.observers.forEach(observer => observer.next(connected));
        }

        this.connected = connected;

        this.connectionCheckTimer = setTimeout(
            this.checkConnection.bind(this),
            this.config.backendConnectionCheckInterval
        );
    }

    /**
     * @param object
     * @return new IdaiFieldObject without the properties which we don't want
     *   to send to the backend.
     */
    private filterUnwantedProps(object:IdaiFieldObject) : IdaiFieldObject {
        var o = ModelUtils.clone(object);
        delete o.synced;
        return o;
    }

    private performPost(object:IdaiFieldObject) : Observable<Response> {

        return this.http.post(this.hostUrl + '/' + this.indexName + '/'
            + this.typeName + '/' + object.id,
            JSON.stringify(object))
    }

    public save(object:IdaiFieldObject):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.performPost(this.filterUnwantedProps(object))
            .subscribe(
                () => resolve(object),
                err => {
                    this.checkConnection();
                    reject();
                }
            );
        });
    }

    public resetIndex(): Promise<any> {

        return new Promise((resolve, reject) => {

            this.deleteIndex()
            .subscribe(
                () => {
                    this.createIndex()
                    .subscribe(
                        () => resolve(),
                        err => reject()
                    )
                },
                err => reject()
            );
        });
    }

    private deleteIndex() : Observable<Response> {

        return this.http.delete(this.hostUrl + '/' + this.indexName);
    }

    private createIndex() : Observable<Response> {

        return this.http.put(this.hostUrl + '/' + this.indexName, "");
    }

}