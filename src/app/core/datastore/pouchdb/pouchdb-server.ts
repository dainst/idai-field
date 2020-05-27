import {Injectable} from '@angular/core';

const express = typeof window !== 'undefined' ? window.require('express') : require('express');

let PouchDB;
if (typeof window !== 'undefined') {
    PouchDB = window.require('pouchdb-browser');
    PouchDB.plugin(require('pouchdb-adapter-idb'));
} else {
    PouchDB = require('pouchdb-node');
}

const expressPouchDB = (typeof window !== 'undefined' ? window.require : require)('express-pouchdb'); // TODO Get rid of warning
const expressBasicAuth = typeof window !== 'undefined' ? window.require('express-basic-auth') : require('express-basic-auth');


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

        app.use(expressBasicAuth({
            challenge: true,
            authorizer: (_: string, password: string) =>
                expressBasicAuth.safeCompare(password, this.password),
            unauthorizedResponse: () => ({ status: 401, reason: 'Name or password is incorrect.' })
        }));

        // prevent the creation of new databases when syncing
        app.put('/:db', (_: any, res: any) =>
            res.status(401).send( { status: 401 }));

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
