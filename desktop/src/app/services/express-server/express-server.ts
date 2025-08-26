import { Injectable } from '@angular/core';
import { ImageStore, ImageVariant, FileInfo, ConfigurationSerializer,
    ConfigReader, Datastore, ProjectConfiguration, RelationsManager, IdGenerator } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';
import { exportConfiguration } from './endpoints/configuration';
import { exportData } from './endpoints/export';
import { importData } from './endpoints/import';
import { Settings } from '../settings/settings';
import { MD } from '../../components/messages/md';

const express = window.require('express');
const remote = window.require('@electron/remote');
const expressPouchDB = window.require('express-pouchdb');
const expressBasicAuth = window.require('express-basic-auth');
const bodyParser = window.require('body-parser');
let PouchDB = window.require('pouchdb-browser');


@Injectable()
export class ExpressServer {

    private password: string;
    private allowLargeFileUploads: boolean;
    private binaryBodyParser = bodyParser.raw({ type: '*/*', limit: '1gb' });
    private textBodyParser = bodyParser.text({ type: '*/*', limit: '1gb' });
    private datastore: Datastore;
    private relationsManager: RelationsManager;
    private projectConfiguration: ProjectConfiguration;


    constructor(private imagestore: ImageStore,
                private configurationSerializer: ConfigurationSerializer,
                private settingsProvider: SettingsProvider,
                private configReader: ConfigReader,
                private idGenerator: IdGenerator,
                private messagesDictionary: MD) {}


    public getPassword = () => this.password;

    public setPassword = (password: string) => this.password = password;

    public getAllowLargeFileUploads = () => this.allowLargeFileUploads;

    public setAllowLargeFileUploads = (allow: boolean) => this.allowLargeFileUploads = allow;

    public getPouchDB = () => PouchDB;

    public setDatastore = (datastore: Datastore) => this.datastore = datastore;

    public setRelationsManager = (relationsManager: RelationsManager) => this.relationsManager = relationsManager;

    public setProjectConfiguration = (projectConfiguration: ProjectConfiguration) =>
        this.projectConfiguration = projectConfiguration;


    /**
     * Provides Fauxton and the CouchDB REST API
     */
    public async setupServer(pouchDirectory?: string) {

        const self = this;
        const app = express();

        if (pouchDirectory) PouchDB = PouchDB.defaults({ prefix: pouchDirectory });

        app.use(expressBasicAuth({
            challenge: true,
            authorizer: (_: string, password: string) =>
                expressBasicAuth.safeCompare(password, this.password),
            unauthorizedResponse: () => ({ status: 401, reason: 'Name or password is incorrect.' })
        }));


        app.get('/files/:project', async (req: any, res: any) => {

            try {
                let list: { [uuid: string]: FileInfo };

                if (!req.query.types) {
                    list = await this.imagestore.getFileInfos(req.params.project, []);
                } else {
                    const imageVariants = [];

                    for (const type of req.query.types) {
                        if (Object.values(ImageVariant).includes(type)) {
                            imageVariants.push(type);
                        }
                    }

                    if (imageVariants.length > 0) {
                        list = await this.imagestore.getFileInfos(req.params.project, imageVariants);
                    } else {
                        res.status(400).send({ reason: 'Invalid types parameter: "' + req.query.types + '"' });
                    }
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
                if (req.query.type === undefined) {
                    res.status(400).send({ reason: `Please provide a 'type', possible values: ${ImageVariant}`});
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


        app.put('/files/:project/:uuid', this.binaryBodyParser, async (req: any, res: any) => {

            try {
                if (req.query.type === undefined) {
                    res.status(400).send({ reason: `Please provide a type, possible values: ${ImageVariant}`});
                }
                else if (Object.values(ImageVariant).includes(req.query.type)) {
                    if (req.query.type === ImageVariant.ORIGINAL && !this.allowLargeFileUploads) {
                        res.status(409).send({ reason: 'Currently no large file uploads accepted.' });
                    } else {
                        await this.imagestore.store(req.params.uuid, req.body, req.params.project, req.query.type);
                        res.status(200).send({});
                    }
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


        app.delete('/files/:project/:uuid', async (req: any, res: any) => {

            try {
                await this.imagestore.remove(req.params.uuid, req.params.project);
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

        app.get('/configuration/:project', async (request: any, response: any) => {

            await exportConfiguration(
                request, response, this.configReader, this.configurationSerializer,
                this.settingsProvider.getSettings().username
            );
        });

        app.get('/export/:format', async (request: any, response: any) => {

            await exportData(request, response, this.projectConfiguration, this.datastore, this.messagesDictionary);
        });

        app.post('/import/:format', this.textBodyParser, async (request: any, response: any) => {

            await importData(request, response, this.projectConfiguration, this.datastore, this.relationsManager,
                this.idGenerator, this.settingsProvider.getSettings(), this.messagesDictionary
            );
        });

        app.get('/info/',  async (_: any, response: any) => {

            try {
                const settings: Settings = this.settingsProvider.getSettings();

                const infoData = {
                    version: remote.app.getVersion(),
                    projects: settings.dbs,
                    activeProject: settings.selectedProject,
                    user: settings.username
                };

                response.header('Content-Type', 'application/json')
                    .status(200)
                    .send(infoData);
            } catch (err) {
                response.status(500).send({ reason: err });
            }
        });

        let conditionalParameters = {};
        if (remote) {
            conditionalParameters = Object.assign(
                conditionalParameters,
                { logPath: `${remote.getGlobal('appDataPath')}/pouchdb-server.log` }
            );
        }


        // prevent the creation of new databases when syncing
        app.put('/db/:db', (_: any, res: any) =>
            res.status(401).send( { status: 401 }));

        app.use('/db/', expressPouchDB(PouchDB, {
            ...conditionalParameters,
            ...{
                mode: 'fullCouchDB',
                overrideMode: {
                    exclude: [
                        'routes/authentication',
                        'routes/authorization',
                        'routes/fauxton',
                        'routes/session'
                    ]
                }
            }
        }));

        let mainAppHandle: any;
        await new Promise<void>((resolve, reject) => {
            mainAppHandle = app.listen(3000, () => {
                console.log('PouchDB Server is listening on port 3000');
                resolve();
            }).on('error', err => reject(err))
        });

        const fauxtonApp = express();

        fauxtonApp.use(expressBasicAuth({
            challenge: true,
            authorizer: (_: string, password: string) =>
                expressBasicAuth.safeCompare(password, this.password),
            unauthorizedResponse: () => ({ status: 401, reason: 'Name or password is incorrect.' })
        }));

        // prevent the creation of new databases when syncing
        fauxtonApp.put('/:db', (_: any, res: any) =>
            res.status(401).send( { status: 401 }));

        fauxtonApp.use(expressPouchDB(PouchDB, {
            ...conditionalParameters,
            ...{
                mode: 'fullCouchDB',
                overrideMode: {
                    exclude: [
                        'replicator',
                        'routes/authentication',
                        'routes/authorization',
                        'routes/security',
                        'routes/session'
                    ]
                }
            }
        }));

        let fauxtonAppHandle: any;
        await new Promise<void>((resolve) => {
            fauxtonAppHandle = fauxtonApp.listen(3001, () => {
                console.log('Fauxton is listening on port 3001');
                resolve();
            });
        });

        return [mainAppHandle, fauxtonAppHandle];
    }
}
