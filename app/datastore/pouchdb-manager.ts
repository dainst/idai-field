import * as PouchDB from "pouchdb";
import {DOCS} from "./sample-objects";
import {ConfigLoader, ProjectConfiguration} from "idai-components-2/configuration";
import {IndexCreator} from "./index-creator";
import {PouchdbProxy} from "./pouchdb-proxy";
import {Injectable} from "@angular/core";

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

    constructor(private configLoader: ConfigLoader) {
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

        let rdy = Promise.resolve();

        if (this.db) rdy = rdy.then(() => this.db.close());

        this.name = name;

        rdy = rdy.then(() => this.createDb());
        if (name == 'test')
            rdy = rdy.then(() => this.db.destroy()).then(() => this.createDb());
        rdy = rdy.then(() => this.indexCreator.go(this.db));
        if (name == 'test')
            rdy = rdy.then(() => this.loadSampleData());
        rdy.then(() => this.resolveDbReady(this.db));
    }

    /**
     * Gets the database object.
     * @returns {PouchdbProxy} a proxy that automatically hands over method
     *  calls to the actual PouchDB instance as soon as it is available
     */
    public getDb(): PouchdbProxy {
        return this.dbProxy;
    }

    public destroy(): Promise<any> {
        return this.db.destroy();
    }

    private createDb(): Promise<any> {
        this.db = new PouchDB(this.name);
        return Promise.resolve(this.db);
    }

    private loadSampleData(): Promise<any> {

        return this.configLoader.getProjectConfiguration().then(config => {

            let promises = [];
            for (let doc of DOCS) {
                doc.created = { user: 'sample_data', date: new Date() };
                doc.modified = [];
                doc['_id'] = doc.resource.id;
                doc.resource['_parentTypes'] = config
                    .getParentTypes(doc.resource.type);
                promises.push(this.db.put(doc));
            }

            return Promise.all(promises)
                .then(() => {
                    console.debug("Successfully stored sample documents");
                    return Promise.resolve(this.db);
                })
                .catch(err => {
                    console.error("Problem when storing sample data", err);
                    return Promise.reject(err);
                });
        });
    }

}