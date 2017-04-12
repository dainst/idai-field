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

    public setRemoteSites(remoteSites) {

        this.datastore.stopSync();
        setTimeout(() => {

            console.log("set up sync");

            this.remoteSites = remoteSites;
            // TODO also unset every sync to remote sites first
            for (let remoteSite of remoteSites) {
                console.log("remoteSite",remoteSite)
                this.datastore.setupSync(remoteSite['ipAddress']).then(syncState => {
                    console.log("got syncState", syncState);
                })
            }
            this.notify();
        },1000);

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
            o.next({
                server: this.getServer()
            })
        }
    }

    public changes(): Observable<Document> {
        return Observable.create( observer => {
            this.observers.push(observer);
        });
    }
}