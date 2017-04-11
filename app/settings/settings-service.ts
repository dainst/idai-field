import {Injectable} from "@angular/core";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class SettingsService {

    // TODO save settings in db

    private remoteSites = [];
    private server = {};
    private userName = "";

    constructor() { }

    public setRemoteSites(remoteSites) {
        this.remoteSites = remoteSites
    }

    public getRemoteSites() {
        return JSON.parse(JSON.stringify(this.remoteSites));
    }

    public setServer(server) {
        this.server = server;
    }

    public getServer() {
        return JSON.parse(JSON.stringify(this.server));
    }

    public setUserName(userName) {
        this.userName = userName;
    }

    public getUserName() {
        return JSON.parse(JSON.stringify(this.userName));
    }
}