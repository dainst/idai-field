import {Injectable, Inject} from "@angular/core";
import {Http, Headers} from "@angular/http";
import {IdaiFieldObject} from "../model/idai-field-object";
import {ModelUtils} from '../model/model-utils';
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Response} from "@angular/http";

/**
 * @author Jan G. Wieners
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class IdaiFieldBackend {

    private connected: boolean;
    private connectionStateObservers: Observer<boolean>[] = [];
    private configuration: any;

    public constructor(private http: Http,
        @Inject('app.config') private config) {

        this.validateAndUse(config.backend);
        this.checkConnection();
    }

    /**
     * @param backendConfig backend Configuration object.
     */
    private validateAndUse(backendConfig) {
        // if (! backendConfig.uri.endsWith('/'))
        //     backendConfig.uri=backendConfig.uri+='/';
        // TODO remove / if exists

        this.configuration = backendConfig;
    }


    /**
     * @returns {any}
     */
    public connectionStatus(): Observable<boolean> {
        return Observable.create( observer => {
            this.connected=false;
            this.connectionStateObservers.push(observer);
        });
    }


    /**
     * @see also this#setConnectionStatus
     */
    public checkConnection(): void {
        this.http.get( this.configuration.uri )
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
            this.configuration.connectionCheckInterval
        );
    }

    private createAuthorizationHeader() {
        var headers = new Headers();
        headers.append('Authorization', 'Basic ' +
            btoa(this.configuration.credentials));
        return headers;
    }

    private performPut(resourceId:string,document:any) : Observable<Response> {

        return this.http.put(this.configuration.uri
            + resourceId,
            JSON.stringify(document), 
            {headers: this.createAuthorizationHeader()});

    }

    /**
     * Saves or updates an object to the backend.
     *
     * @param object, uniquely identified by object.id.
     * @returns {Promise<T>}
     */
    public save(document:any,dataset:string):Promise<IdaiFieldObject> {
        if (dataset) document['dataset']=dataset;
        
        return new Promise((resolve, reject) => {
            this.performPut(document['resource']['@id'],document).subscribe(
                  () => resolve(document),
                  err => {
                      this.checkConnection();
                      reject(err);
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
                        err => reject(err)
                    )
                },
                err => reject(err)
            );
        });
    }

    private deleteIndex(): Observable<Response> {

        return this.http.delete(this.configuration.uri);
    }

    private createIndex(): Observable<Response> {

        return this.http.put(this.configuration.uri, "");
    }

}