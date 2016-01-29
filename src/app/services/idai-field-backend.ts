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
    private backendUri : string;
    private connected : boolean;
    private connectionCheckTimer: number;
    private observers: Observer<boolean>[] = [];

    public constructor(private http: Http,
        @Inject('app.config') private config) {
        this.checkConnection();
    }

    public isConnected(): Observable<boolean> {
        return Observable.create( observer => {
            this.observers.push(observer);
            observer.next(false);
        });
    }

    public checkConnection(): void {

        //
        // TODO remove as soon
        // as necessary changes are implemented in chronontology-connected.
        //
        var backendUri = this.config.backendUri;
        if (this.config.environment=='production')
            backendUri = backendUri + '/' + this.typeName + '/';

        this.http.get( backendUri )
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

    private createAuthorizationHeader() {
        var headers = new Headers();
        headers.append('Authorization', 'Basic ' +
            btoa(this.config.credentials));
        return headers;
    }


    private performPut(object:IdaiFieldObject) : Observable<Response> {

        return this.http.put(this.config.backendUri + '/'
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

        return this.http.delete(this.config.backendUri);
    }

    private createIndex() : Observable<Response> {

        return this.http.put(this.config.backendUri, "");
    }

}