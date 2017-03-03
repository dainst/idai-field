import {Injectable} from "@angular/core";
import {PouchdbDatastore} from "./pouchdb-datastore";

import * as express from 'express';
var expressPouchDB = require('express-pouchdb');

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class PouchdbServerDatastore extends PouchdbDatastore {

    protected setupDatabase(): Promise<any> {
        return new Promise((resolve, reject) => {
            var app = express();
            app.use('/db', expressPouchDB(PouchDB, {
                mode: 'minimumForPouchDB'
            }));
            app.listen(3000, function () {
                console.log("PouchDB Server listening on port 3000");
                resolve();
            });
        })
    }

}