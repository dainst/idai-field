import {Injectable} from '@angular/core';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
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

        app.post('/files/:project/*', (req: any, res: any, next: any) => {
            const prefix = remote.getGlobal('appDataPath') + '/imagestore/';
            const path = prefix + req.params['project'] + '/' + req.params[0];

            // https://stackoverflow.com/a/16599008
            req.on('data', function(data) {
                fs.writeFileSync(path, data);
            });
            req.on('end', function() {
                res.status(200).send( { status: 'ok' });
            });
        });

        app.get('/files/:project/*', (req: any, res: any) => {
            const prefix = remote.getGlobal('appDataPath') + '/imagestore/';
            const path = prefix + req.params['project'] + '/' + req.params[0];

            if (!fs.existsSync(path)) {
                res.status(200).send({ status: 'notfound' });
            } else {
                if (fs.lstatSync(path).isDirectory()) {
                    const result = PouchdbServer
                        .l(path)
                        .map(p => p.replace(prefix, ''))
                        .map(p => p.replace('//', '/'))
                        .map(p => '/files/' + p);

                    res.status(200).send( { files: result});
                } else {
                    res
                    .header('Content-Type', 'image/png')
                    .status(200).sendFile(path);
                }
            }
        });

        // prevent the creation of new databases when syncing
        app.put('/:db', (_: any, res: any) =>
            res.status(401).send( { status: 401 }));

        app.use('/', expressPouchDB(PouchDB, {
            logPath: remote.getGlobal('appDataPath') + '/pouchdb-server.log',
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


    // see https://stackoverflow.com/a/16684530
    private static l(dir) {
        var results = [];
        var list = fs.readdirSync(dir);
        list.forEach(function(file) {
            file = dir + '/' + file;
            var stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results = results.concat(PouchdbServer.l(file));
            } else {
                /* Is a file */
                results.push(file);
            }
        });
        return results;
    }
}
