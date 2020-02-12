import {Injectable} from '@angular/core';
import * as express from 'express';
import * as PouchDB from 'pouchdb';

const expressPouchDB = require('express-pouchdb');
const expressBasicAuth = require('express-basic-auth');


@Injectable()
export class PouchdbServer {

    private password: string;


    public getPassword = () => this.password;


    public setPassword = (password: string) => this.password = password;


    /**
     * Provides Fauxton and the CouchDB REST API
     */
    public async setupServer() {

        const app = express();
        app.use(expressBasicAuth( {
            challenge: true,
            authorizer: (_: string, password: string) =>
                expressBasicAuth.safeCompare(password, this.password)
            } ));
        app.use('/', expressPouchDB(PouchDB, {
            mode: 'fullCouchDB',
            overrideMode: {
                include: ['routes/fauxton'],
                exclude: [
                    'routes/authentication',
                    'routes/authorization',
                    'routes/session'
                ]
            }
        }));
        await app.listen(3000, function() {
            console.debug('PouchDB Server is listening on port 3000');
        });
    }

}