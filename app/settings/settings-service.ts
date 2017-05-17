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
    ) { }


    public getProjects() {
        return ['pergamon','fzavodnik','pgerth','doliveira','scuy','tkleinke','jwieners'];
    }

    public selectProject(name) {
        this.datastore.select(name);
    }

    public init() {
        this.ready = this.loadSettingsFromConfigFile().then((inTestMode)=>{
            if (inTestMode != true) {
                this.datastore.select('pergamon');
                this.setupSync();
            }
        })
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
        let userName = JSON.parse(JSON.stringify(this.userName));
        return userName ? userName : 'anonymous';
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
        if (this.serverSettingsComplete()) {
            promises.push(this.datastore.setupSync(
                'http://' + this.server['userName'] + ':' + this.server['password'] + '@'
                + this.server['ipAddress'] + ':' + this.server['port'] + '/' + this.server['dbName']));
        }

        this.notify();
        return Promise.all(promises);
    }

    private loadSettingsFromConfigFile(): Promise<any> {

        return this.readConfigFile()
                .then(
                    config => {
                        if (config['remoteSites']) this.remoteSites = config['remoteSites'];
                        if (config['server']) this.server = config['server'];
                        if (config['userName']) this.userName = config['userName'];
                        return Promise.resolve(config['environment'] == 'test');
                    }
                )

    }

    public updateConfigFile(): Promise<any> {

        return new Promise((resolve, reject) => {
            this.readConfigFile()
                .then(
                    config => {
                        const updatedConfig = this.updateConfigValues(config);
                        return this.writeConfigFile(updatedConfig);
                    }, err => reject(err)
                ).then(
                    () => resolve(),
                    err => reject(err)
                );
        });
    }

    private updateConfigValues(config: any): any {

        let updatedConfig = JSON.parse(JSON.stringify(config));

        let remoteSites = [];
        if (this.remoteSites.length > 0) {
            for (let remoteSite of this.remoteSites) {
                if (remoteSite['ipAddress'] && remoteSite['ipAddress'].length > 0) {
                    remoteSites.push(remoteSite);
                }
            }
        }
        if (remoteSites.length > 0) {
            updatedConfig['remoteSites'] = remoteSites;
        } else {
            delete updatedConfig['remoteSites'];
        }

        if (this.server['userName'] || this.server['password'] || this.server['ipAddress'] ||
            this.server['port'] || this.server['dbname']) {
            updatedConfig['server'] = this.server;
        } else {
            delete updatedConfig['server'];
        }

        if (this.userName.length > 0) {
            updatedConfig['userName'] = this.userName;
        } else {
            delete updatedConfig['userName'];
        }

        return updatedConfig;
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

    private serverSettingsComplete(): boolean {

        return (this.server['userName'] && this.server['userName'].length > 0 &&
            this.server['password'] && this.server['password'].length > 0 &&
            this.server['ipAddress'] && this.server['ipAddress'].length > 0 &&
            this.server['port'] && this.server['port'].length > 0 &&
            this.server['dbName'] && this.server['dbName'].length > 0);
    }

}