import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
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

    private typeName   : string = "objects";
    private connected : boolean;
    private connectionStateObservers: Observer<boolean>[] = [];

    public constructor(private http: Http,
        @Inject('app.config') private config) {
        this.checkConnection();
    }

    public isConnected(): Observable<boolean> {
        return Observable.create( observer => {
            this.connectionStateObservers.push(observer);
            observer.next(false);
        });
    }


    /**
     * @see also this#setConnectionStatus
     */
    public checkConnection(): void {

        this.http.get( this.aliveUri() )
        .subscribe(
            data => this.setConnectionStatus(true),
            err => this.setConnectionStatus(false)
        );
    }

    /**
     * Stands in a relationship of mutual calls with
     * this#checkConnection. Both methods together form a loop.
     *
     * @param connected
     */
    private setConnectionStatus(connected: boolean) {

        if (connected != this.connected) {
            this.connectionStateObservers.forEach(observer => observer.next(connected));
        }

        this.connected = connected;

       setTimeout(
            this.checkConnection.bind(this),
            this.config.backend.connectionCheckInterval
        );
    }

    /**
     * TODO remove as soon as chronontology-backend endpoint is implemented
     * @returns {string}
     */
    private aliveUri() : string {

        var uri = this.config.backend.uri;
        if (this.config.environment=='production')
            uri = uri + '/' + this.typeName + '/';
        return uri;
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

    private createAuthorizationHeader() {
        var headers = new Headers();
        headers.append('Authorization', 'Basic ' +
            btoa(this.config.backend.credentials));
        return headers;
    }


    private performPut(object:IdaiFieldObject) : Observable<Response> {

        return this.http.put(this.config.backend.uri + '/'
            + this.typeName + '/' + object.id,
            JSON.stringify(object), { headers: this.createAuthorizationHeader()})
    }

    /**
     * Saves or updates an object to the backend.
     *
     * @param object, uniquely identified by object.id.
     * @returns {Promise<T>}
     */
    public save(object:IdaiFieldObject):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.performPut(this.filterUnwantedProps(object))
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

        return this.http.delete(this.config.backend.uri);
    }

    private createIndex() : Observable<Response> {

        return this.http.put(this.config.backend.uri, "");
    }

}