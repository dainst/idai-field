import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";

const remote = require('electron').remote;
const fs = remote.require('fs');


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class SettingsService {

    private remoteSites = [];
    private server = {};
    private userName = "";
    private observers: Observer<any>[] = [];

    public ready: Promise<any>;

    constructor(
        private datastore: IdaiFieldDatastore
    ) {
        this.ready = this.loadFromConfigFile();
    }

    public setRemoteSites(remoteSites): Promise<any> {

        return new Promise<any>((resolve)=>{
            this.datastore.stopSync();
            setTimeout(() => {
                this.remoteSites = remoteSites;
                this.setupSync().then(() => resolve());
            }, 1000);
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

    private setupSync(): Promise<any> {

        const promises = [];
        for (let remoteSite of this.remoteSites) {
            promises.push(this.datastore.setupSync(remoteSite['ipAddress']));
        }
        this.notify();
        return Promise.all(promises);
    }

    private loadFromConfigFile(): Promise<any> {

        return new Promise((resolve, reject) => {
            this.readConfigFile()
                .then(
                    config => {
                        if (config['remoteSites']) this.remoteSites = config['remoteSites'];
                        return this.setupSync();
                    }, err => reject(err)
                ).then(
                    () => resolve(),
                    err => reject(err)
                )
        });
    }

    public updateConfigFile(): Promise<any> {

        return new Promise((resolve, reject) => {
            this.readConfigFile()
                .then(
                    config => {
                        config['remoteSites'] = this.remoteSites;
                        return this.writeConfigFile(config);
                    }, err => reject(err)
                ).then(
                    () => resolve(),
                    err => reject(err)
                );
        });
    }

    private readConfigFile(): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.readFile(remote.getGlobal('configPath'), 'utf-8', (err, content) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(content));
                }
            });
        });
    }

    private writeConfigFile(config: any): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.writeFile(remote.getGlobal('configPath'), JSON.stringify(config), err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

}