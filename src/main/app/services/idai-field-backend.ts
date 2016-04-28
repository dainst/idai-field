import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {IdaiFieldObject} from "../model/idai-field-object";
import {ModelUtils} from '../model/model-utils';
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Response} from "angular2/http";
import {ProjectConfiguration} from "./project-configuration";

/**
 * @author Jan G. Wieners
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class IdaiFieldBackend {

    private typeName: string = "objects";
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
        if (! backendConfig.uri.endsWith('/'))
            backendConfig.uri=backendConfig.uri+='/';

        this.configuration = backendConfig;
    }


    /**
     * TODO rename to getConnectionStatus
     *
     * @returns {any}
     */
    public isConnected(): Observable<boolean> {
        return Observable.create( observer => {
            this.connectionStateObservers.push(observer);
        });
    }


    /**
     * // TODO rename to triggerSomething
     *
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

    private performPut(id:string,document:any) : Observable<Response> {

        return this.http.put(this.configuration.uri
                    + this.typeName + '/' + id,
                    JSON.stringify(document), {headers: this.createAuthorizationHeader()});

    }

    /**
     * Saves or updates an object to the backend.
     *
     * @param object, uniquely identified by object.id.
     * @returns {Promise<T>}
     */
    public save(object:IdaiFieldObject,dataset:string):Promise<IdaiFieldObject> {
        return new Promise((resolve, reject) => {

            this.performPut(object.id,this.createDocument(object,dataset)).subscribe(
                  () => resolve(object),
                  err => {
                      this.checkConnection();
                      reject(err);
                  }
              );
        });
    }

    /**
     * Creates a document by taking the object as a resource,
     * filtering out unnecessary properties and adding dataset information.
     *
     * @param object the resource of the document to be created.
     * @returns a document as expected by the backend.
     */
    private createDocument(object:IdaiFieldObject,dataset:string) : any {

        var document= {"resource":{}};
        document["resource"]= ModelUtils.filterUnwantedProps(object);
        if (dataset!=undefined) document['dataset']=dataset;
        return document;
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