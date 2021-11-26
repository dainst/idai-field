import {Injectable} from '@angular/core';
import { Filestore } from '../../filestore/filestore';

const express = typeof window !== 'undefined' ? window.require('express') : require('express');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');
const expressPouchDB = (typeof window !== 'undefined' ? window.require : require)('express-pouchdb'); // Get rid of warning
const expressBasicAuth = typeof window !== 'undefined' ? window.require('express-basic-auth') : require('express-basic-auth');


@Injectable()
export class PouchdbServer {

    private password: string;

    public getPassword = () => this.password;

    public setPassword = (password: string) => this.password = password;

    constructor(private filestore: Filestore) {}


    /**
     * Provides Fauxton and the CouchDB REST API
     */
    public async setupServer() {

        const self = this;
        const app = express();

        app.use(expressBasicAuth({
            challenge: true,
            authorizer: (_: string, password: string) =>
                expressBasicAuth.safeCompare(password, this.password),
            unauthorizedResponse: () => ({ status: 401, reason: 'Name or password is incorrect.' })
        }));

        app.post('/files/:project/*', (req: any, res: any, next: any) => {
            // https://stackoverflow.com/a/16599008
            req.on('data', function(data) {
                self.filestore.writeFile('/' + req.params['project'] + '/' + req.params[0], data)
            });
            req.on('end', function() {
                res.status(200).send({ status: 'ok' });
            });
        });

        app.get('/files/:project/*', (req: any, res: any) => {
            const path = '/' + req.params['project'] + '/' + req.params[0];

            if (!self.filestore.fileExists(path)) {
                res.status(200).send({ status: 'notfound' });
            } else {
                if (self.filestore.isDirectory(path)) {
                    res.status(200).send({ files: self.filestore.listFiles(path) });
                } else {
                    res
                        .header('Content-Type', 'image/png')
                        .status(200).sendFile(self.filestore.getFullPath(path));
                }
            }
        });

        // prevent the creation of new databases when syncing
        app.put('/:db', (_: any, res: any) =>
            res.status(401).send( { status: 401 }));

        app.use('/sync/', expressPouchDB(PouchDB, {
            logPath: remote.getGlobal('appDataPath') + '/pouchdb-server.log',
            mode: 'fullCouchDB',
            overrideMode: {
                exclude: [
                    'routes/authentication',
                    'routes/authorization',
                    'routes/session'
                ]
            }
        }));

        // Out of the box, Fauxton (with PouchDB, as well as with CouchDB) does
        // not work with paths other than '/', which is why we duplicate the /sync route
        // at / app.
        //
        // Related GitHub issues:
        // - https://stackoverflow.com/questions/41658926/express-pouchdb-fauxton-on-non-root-route
        // - https://github.com/pouchdb/pouchdb-server/issues/183#issuecomment-280862350
        // - https://stackoverflow.com/questions/64056888/how-can-i-create-separate-pouchdbs-on-separate-endpoints-in-the-same-node-app-l
        //
        app.use('/', expressPouchDB(PouchDB, {
            logPath: remote.getGlobal('appDataPath') + '/pouchdb-server-2.log',
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
