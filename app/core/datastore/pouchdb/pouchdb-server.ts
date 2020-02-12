import {Injectable} from '@angular/core';
import * as express from 'express';
import * as PouchDB from 'pouchdb';

const expressPouchDB = require('express-pouchdb');


@Injectable()
export class PouchdbServer {

    /**
     * Provides Fauxton and the CouchDB REST API
     */
    public async setupServer() {

        const app = express();
        app.use('/', expressPouchDB(PouchDB, {
            mode: 'fullCouchDB',
            overrideMode: {
                include: ['routes/fauxton']
            }
        }));
        await app.listen(3000, function() {
            console.debug('PouchDB Server is listening on port 3000');
        });
    }

}