import {Injectable} from "@angular/core";
import {PouchdbDatastore} from "./pouchdb-datastore";
import * as PouchDB from "pouchdb";

import * as express from 'express';
var expressPouchDB = require('express-pouchdb');

@Injectable()
/**
 * @author Sebastian Cuy
 */
export class PouchdbServerDatastore extends PouchdbDatastore {

    protected setupDatabase(dbname:string): Promise<any> {
        return new Promise((resolve, reject) => {
            var app = express();
            app.use('/db', expressPouchDB(PouchDB, {
                mode: 'minimumForPouchDB'
            }));
            app.listen(3000, function () {
                console.log("PouchDB Server listening on port 3000", dbname);
                resolve(new PouchDB(dbname));
            });
        })
    }

}