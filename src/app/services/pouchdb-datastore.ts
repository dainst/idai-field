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
        this.db.put({ "_id": "ob1", "title": "Obi One Kenobi" });
        this.db.put({ "_id": "ob2", "title": "Jar Jar Two" });
    }

    getObjects(): Promise<IdaiFieldObject[]> {

        return this.db.allDocs({
            include_docs: true,
            attachments: true
        }).then(data => {

            var result: IdaiFieldObject[] = [];
            for (var row of data.rows) {
                result.push(row.doc);
            }
            return result;
        });
    }
}