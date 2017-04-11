import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";

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

    constructor() { }

    public setRemoteSites(remoteSites) {
        this.remoteSites = remoteSites;
        this.notify();
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