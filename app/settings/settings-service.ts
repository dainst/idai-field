import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class SettingsService {

    // TODO save settings in db

    private remoteSites = [];
    private server = {};
    private userName = "";
    private observers : Observer<any>[] = [];

    constructor(
        private datastore: IdaiFieldDatastore
    ) { }

    public setRemoteSites(remoteSites): Promise<any> {

        return new Promise<any>((resolve)=>{
            this.datastore.stopSync();
            setTimeout(() => {
                this.remoteSites = remoteSites;
                const promises = [];
                for (let remoteSite of remoteSites) {
                    promises.push(this.datastore.setupSync(remoteSite['ipAddress']));
                }
                this.notify();
                Promise.all(promises).then(()=>resolve());
            },1000);
        })
    }

    public getRemoteSites() {
        return JSON.parse(JSON.stringify(this.remoteSites));
    }

    public setServer(server) {
        this.server = server;
        this.notify();
    }

    public getServer() {
        return JSON.parse(JSON.stringify(this.server));
    }

    public setUserName(userName) {
        this.userName = userName;
        this.notify();
    }

    public getUserName() {
        return JSON.parse(JSON.stringify(this.userName));
    }

    private notify() {
        for (let o of this.observers) {
            console.log(o.next({
                server: this.getServer()
            }))
        }
    }

    public changes(): Observable<Document> {
        return Observable.create( observer => {
            this.observers.push(observer);
        });
    }
}