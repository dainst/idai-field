import * as PouchDB from "pouchdb";
import {IndexCreator} from "./index-creator";
import {PouchdbProxy} from "./pouchdb-proxy";
import {Injectable} from "@angular/core";
import {AbstractSampleDataLoader} from "./abstract-sample-data-loader";

/**
 * Manages the creation of PouchDB instances.
 * Also handles loading of sample data if 'test' database is selected.
 * @author Sebastian Cuy
 */
@Injectable()
export class PouchdbManager {

    private db = undefined;
    private dbProxy = undefined;
    private name:string = undefined;
    private indexCreator = new IndexCreator();

    private resolveDbReady = undefined;

    constructor(private sampleDataLoader: AbstractSampleDataLoader) {
        let dbReady = new Promise(resolve => this.resolveDbReady = resolve);
        this.dbProxy = new PouchdbProxy(dbReady);
    }

    /**
     * Selects the current database.
     * This method has to be called before the database can be used.
     * @param name the database name
     */
    public select(name: string): void {

        // same db selected, no need for action
        if (this.name == name) return;

        let rdy: Promise<any> = Promise.resolve();

        if (this.db) {
            let dbReady = new Promise(resolve => this.resolveDbReady = resolve);
            this.dbProxy.switchDb(dbReady);
            rdy = rdy.then(() => this.db.close());
        }

        this.name = name;

        rdy = rdy.then(() => this.createDb());
        if (name == 'test') {
            rdy = rdy.then(() => this.db.destroy()).then(() => this.createDb());
        }
        rdy = rdy.then(() => this.indexCreator.go(this.db));
        if (name == 'test') {
            rdy = rdy.then(config => this.sampleDataLoader.go(this.db, this.name));
        }
        rdy.then(() => this.resolveDbReady(this.db));
    }

    public getIndexCreator() {
        return this.indexCreator;
    }

    /**
     * Gets the database object.
     * @returns {PouchdbProxy} a proxy that automatically hands over method
     *  calls to the actual PouchDB instance as soon as it is available
     */
    public getDb(): PouchdbProxy {
        return this.dbProxy;
    }

    public getName(): string {
        return this.name;
    }

    public destroy(): Promise<any> {
        return this.db.destroy();
    }

    public destroyDb(dbName: string): Promise<any> {
        return new PouchDB(dbName).destroy();
    }

    private createDb(): Promise<any> {
        this.db = new PouchDB(this.name);
        return Promise.resolve(this.db);
    }

}