import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";

const remote = require('electron').remote;
const fs = remote.require('fs');


@Injectable()
/**
 * The settings service provides access to the
 * properties of the config.json file. It can
 * be serialized to and from config.json files.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class SettingsService {

    private remoteSites = [];
    private server = {};
    private userName = "";
    private observers: Observer<any>[] = [];
    private selectedProject;
    private environment;


    public ready: Promise<any>;

    constructor(
        private datastore: IdaiFieldDatastore
    ) { }


    public getProjects() {
        return ['pergamon','fzavodnik','pgerth','doliveira','scuy','tkleinke','jwieners'];
    }

    public selectProject(name) {
        this.selectedProject = name;
    }

    public init() {
        this.ready = this.loadSettings().then(()=>{
            if (this.environment == 'test') {
                this.selectProject('test');
                this.datastore.select('test');
            } else if (this.getProjects().length > 0) {
                this.datastore.select(this.getProjects()[0]);
                this.selectProject(this.getProjects()[0]);
                this.setupSync();
            }
        })
    }


    public restartSync() {
        this.datastore.select(this.selectedProject);
        return new Promise<any>((resolve)=>{
            this.datastore.stopSync();
            setTimeout(() => {
                this.setupSync().then(() => resolve());
            }, 1000);
        })
    }

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
                + this.server['ipAddress'] + ':' + this.server['port']));
        }

        this.notify();
        return Promise.all(promises);
    }

    private loadSettings(): Promise<any> {

        return new Promise((resolve) => {

            this.userName = remote.getGlobal('config')['userName'];
            this.remoteSites = remote.getGlobal('config')['remoteSites'];
            this.environment = remote.getGlobal('config')['environment'];
            this.server = remote.getGlobal('config')['server'];
            resolve();
        });
    }

    public storeSettings(): Promise<any> {

        let configToWrite = {};

        let remoteSites = [];
        if (this.remoteSites.length > 0) {
            for (let remoteSite of this.remoteSites) {
                if (remoteSite['ipAddress'] && remoteSite['ipAddress'].length > 0) {
                    remoteSites.push(remoteSite);
                }
            }
        }
        if (remoteSites.length > 0) {
            configToWrite['remoteSites'] = remoteSites;
        }

        if (this.server['userName'] || this.server['password'] || this.server['ipAddress'] ||
            this.server['port']) {
            configToWrite['server'] = this.server;
        }

        if (this.userName.length > 0) {
            configToWrite['userName'] = this.userName;
        }

        if (this.environment) {
            configToWrite['environment'] = this.environment;
        }

        return this.writeConfigFile(configToWrite);
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
            this.server['port'] && this.server['port'].length > 0);
    }
}