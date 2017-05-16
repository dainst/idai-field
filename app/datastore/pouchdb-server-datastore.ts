import * as PouchDB from "pouchdb";
import * as express from 'express';
import {PouchdbDatastore} from "./pouchdb-datastore";
import {IdaiFieldDatastore} from "./idai-field-datastore";
const expressPouchDB = require('express-pouchdb');
import {Injectable} from "@angular/core";

// suppress compile errors for PouchDB view functions
declare function emit(key:any, value?:any):void;

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbServerDatastore extends PouchdbDatastore implements IdaiFieldDatastore {

    protected setupServer(): Promise<any> {
        return new Promise((resolve, reject) => {
            const app = express();
            app.use('/', expressPouchDB(PouchDB, {
                mode: 'fullCouchDB',
                overrideMode: {
                    include: ['routes/fauxton']
                }
            }));
            app.listen(3000, function () {
                console.log("PouchDB Server listening on port 3000");
                resolve();
            });
        })
    }
}