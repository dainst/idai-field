import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";
import {OBJECTS} from "./sample-objects";

declare var PouchDB: any;

@Injectable()
export class PouchdbDatastore implements Datastore {

    private db: any;

    constructor() {

        this.db = new PouchDB('objects');
        this.loadSampleData();
    }

    loadSampleData(): void {

        var promises = [];
        for (var ob of OBJECTS) promises.push(this.db.put(ob));
        Promise.all(promises).then(
            () => console.log("Successfully stored sample objects in PouchDB"),
            err => console.error("Problem when storing sample data in PouchDB", err)
        );
    }

    save(object:IdaiFieldObject):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.put(object).then(data => resolve(data), err => reject(err));
        });
    }

    get(id:string):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.db.get(id).then(data => resolve(data), err => reject(err));
        });
    }

    find(query:string, options:any):Promise<IdaiFieldObject[]> {

        // TODO implement based on allDocs() and intelligent id generation,
        // using query() or using pouchdb-find plugin
        // see: http://pouchdb.com/guides/queries.html
        return new Promise(resolve => resolve([]));
    }

    all(options:any):Promise<IdaiFieldObject[]> {

        // TODO implement query options

        return new Promise<IdaiFieldObject[]>((resolve, reject) => {
            this.db.allDocs({
                include_docs: true,
                attachments: true
            }).then(data => {

                var result:IdaiFieldObject[] = [];
                for (var row of data.rows) {
                    result.push(row.doc);
                }
                resolve(result);
            }, err => reject(err));
        });
    }

}