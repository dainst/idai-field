import {Injectable, Inject} from "@angular/core";
import {Http, Headers} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Response} from "@angular/http";
import {IdaiFieldDocument} from '../model/idai-field-document'
import {SettingsService} from "../settings/settings-service";


@Injectable()
/**
 * @author Jan G. Wieners
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdaiFieldBackend {

    private connected: boolean;
    private connectionStateObservers: Observer<boolean>[] = [];
    private configuration: any = {};

    public constructor(private http: Http,
        @Inject('app.config') private config,
        settingsService: SettingsService) {

        this.configuration['connectionCheckInterval'] = 1000;
        
        settingsService.changes().subscribe(changes => {
            this.configuration.uri = changes['server']['ipAddress'];
            if (!this.configuration.uri) return;
            if (this.configuration.uri.endsWith('/')) {
                this.configuration.uri=this.configuration.uri.replace(/\/$/, "");
            }
            this.configuration.credentials = changes['server']['userName'] + ':' + changes['server']['password'];

            if (!this.configuration.credentials) return;
            setTimeout(
                this.checkConnection.bind(this),
                this.configuration.connectionCheckInterval
            );
        });
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

        if (!this.configuration.uri || !this.configuration.credentials) {
            return this.setConnectionStatus(false);
        }

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
        const headers: Headers = new Headers();
        headers.append('Authorization', 'Basic ' +
            btoa(this.configuration.credentials));
        return headers;
    }

    private performPut(resourceId:string,document:any) : Observable<Response> {

        return this.http.put(this.configuration.uri + '/' + document['resource']['type'] + '/'
            + resourceId,
            JSON.stringify(document), 
            {headers: this.createAuthorizationHeader()});

    }

    /**
     * Saves or updates an object to the backend.
     *
     * @param document
     * @param dataset
     * @returns {Promise<IdaiFieldDocument>} success -> an idai field document
     *   error -> an error message or message key
     */
    public save(document:any,dataset:string):Promise<IdaiFieldDocument> {

        if (dataset) document['dataset'] = dataset;
        
        return new Promise((resolve, reject) => {
            this.performPut(document['resource']['id'],document).subscribe(
                  () => resolve(document),
                  err => {
                      this.checkConnection();
                      reject(err);
                  }
              );
        });
    }
}