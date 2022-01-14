import { Injectable } from '@angular/core';
import { ImageStore, ImageVariant, FileInfo } from 'idai-field-core';

const express = typeof window !== 'undefined' ? window.require('express') : require('express');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');
const expressPouchDB = (typeof window !== 'undefined' ? window.require : require)('express-pouchdb'); // Get rid of warning
const expressBasicAuth = typeof window !== 'undefined' ? window.require('express-basic-auth') : require('express-basic-auth');
const bodyParser = typeof window !== 'undefined' ? window.require('body-parser') : require('body-parser');

@Injectable()
export class ExpressServer {

    private password: string;

    private binaryBodyParser = bodyParser.raw({ type: '*/*', limit: '200mb' });

    public getPassword = () => this.password;

    public setPassword = (password: string) => this.password = password;

    constructor(private imagestore: ImageStore) { }


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


        app.get('/files/:project', (req: any, res: any) => {

            try {
                let list: { [uuid: string]: FileInfo };

                if (!req.query.type) {
                    list = this.imagestore.getFileIds(req.params.project, []);
                } else if (Object.values(ImageVariant).includes(req.query.type)) {
                    list = this.imagestore.getFileIds(req.params.project, [req.query.type]);
                } else {
                    res.status(400).send({ reason: 'Invalid parameter for type: "' + req.query.type + '"' });
                }
                res.status(200).send(list);
            } catch (e) {
                if (e.code === 'ENOENT') {
                    res.status(404).send({ reason: 'Unknown project.' });
                } else {
                    console.log(e);
                    res.status(500).send({ reason: 'Whoops?' });
                }
            }
        });


        app.get('/files/:project/:uuid', async (req: any, res: any) => {

            try {
                if (!req.query.type) {
                    const data = await self.imagestore.getData(req.params.uuid, ImageVariant.ORIGINAL, req.params.project);
                    res.header('Content-Type', 'image/*').status(200).send(
                        data
                    );
                } else if (Object.values(ImageVariant).includes(req.query.type)) {
                    const data = await self.imagestore.getData(req.params.uuid, req.query.type, req.params.project);
                    res.header('Content-Type', 'image/*').status(200).send(
                        data
                    );
                } else {
                    res.status(400).send({ reason: 'Invalid parameter for type: "' + req.query.type + '"' });
                }
            } catch (e) {
                if (e.code === 'ENOENT') {
                    res.status(404).send({ reason: 'Image file not found.' });
                } else {
                    console.log(e);
                    res.status(500).send({ reason: 'Whoops?' });
                }
            }


        });


        app.put('/files/:project/:uuid', this.binaryBodyParser, (req: any, res: any) => {

            try {
                if (!req.query.type) {
                    this.imagestore.store(req.params.uuid, req.body, req.params.project);
                    res.status(200).send({});
                } else if (Object.values(ImageVariant).includes(req.query.type)) {
                    this.imagestore.store(req.params.uuid, req.body, req.params.project, req.query.type);
                    res.status(200).send({});
                }
            } catch (e) {
                if (e.code === 'ENOENT') {
                    res.status(404).send({ reason: 'Unknown project.' });
                } else {
                    console.log(e);
                    res.status(500).send({ reason: 'Whoops?' });
                }
            }
        });


        app.delete('/files/:project/:uuid', (req: any, res: any) => {

            try {
                this.imagestore.remove(req.params.uuid, req.params.project);
                res.status(200).send({});
            } catch (e) {
                if (e.code === 'ENOENT') {
                    res.status(404).send({ reason: 'Unknown project.' });
                } else {
                    console.log(e);
                    res.status(500).send({ reason: 'Whoops?' });
                }
            }
        });


        app.use('/db/', expressPouchDB(PouchDB, {
            logPath: remote.getGlobal('appDataPath') + '/pouchdb-server.log',
            mode: 'fullCouchDB',
            overrideMode: {
                exclude: [
                    'routes/authentication',
                    'routes/authorization',
                    'routes/fauxton',
                    'routes/session'
                ]
            },
        }));

        await app.listen(3000, () => {
            console.log('PouchDB Server is listening on port 3000');
        });

        const fauxtonApp = express();

        fauxtonApp.use(expressPouchDB(PouchDB, {
            mode: 'fullCouchDB',
            overrideMode: {
                exclude: [
                    'replicator',
                    'routes/authentication',
                    'routes/authorization',
                    'routes/session'
                ]
            }
        }));

        await fauxtonApp.listen(3001, () => {
            console.log('Fauxton is listening on port 3001');
        });
    }
}
