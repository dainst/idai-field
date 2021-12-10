import {Injectable} from '@angular/core';
import { Imagestore, ImageVariant } from 'idai-field-core';
import { FsAdapter } from './imagestore/fs-adapter';

const express = typeof window !== 'undefined' ? window.require('express') : require('express');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');
const expressPouchDB = (typeof window !== 'undefined' ? window.require : require)('express-pouchdb'); // Get rid of warning
const expressBasicAuth = typeof window !== 'undefined' ? window.require('express-basic-auth') : require('express-basic-auth');
const bodyParser =  typeof window !== 'undefined' ? window.require('body-parser') : require('body-parser');

@Injectable()
export class ExpressServer {

    private password: string;

    private binaryBodyParser = bodyParser.raw({type: 'image/*', limit : '50mb'});

    public getPassword = () => this.password;

    public setPassword = (password: string) => this.password = password;

    constructor(private filesystem: FsAdapter, private imagestore: Imagestore) {}


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


        app.get('/files/:project/list', (req: any, res: any) => {

            const requestedType = this.parseFileType(req.query.type);

            try {
                let list: string[];
                if (requestedType === ImageVariant.ORIGINAL) {
                    list = this.imagestore.getOriginalFilePaths(req.params.project);
                } else if (requestedType === ImageVariant.THUMBNAIL) {
                    list = this.imagestore.getThumbnailFilePaths(req.params.project);
                } else {
                    list = this.imagestore.getAllFilePaths(req.params.project);
                }
                res.status(200).send({list});
            } catch (e) {
                if (e.code === 'ENOENT'){
                    res.status(404).send({reason: 'Unknown project.'});
                } else {
                    console.log(e);
                    res.status(500).send({reason: 'Whoops?'});
                }
            }
        });


        app.get('/files/:project/data', async (req: any, res: any) => {

            const requestedType = this.parseFileType(req.query.type);

            if (req.query.id && requestedType !== undefined) {
                try {
                    const data = await self.imagestore.getData(req.query.id, requestedType, req.params.project);
                    res.header('Content-Type', 'image/*').status(200).send(
                        data
                    );
                } catch (e) {
                    if (e.code === 'ENOENT'){
                        res.status(404).send({reason: 'Image files not found.'});
                    } else {
                        console.log(e);
                        res.status(500).send({reason: 'Whoops?'});
                    }
                }
            } else {
                res.status(400).send({reason: 'Missing valid parameters for "id" and "type".'});
            }

        });


        app.post('/files/:project', this.binaryBodyParser, (req: any, res: any) => {

            if (req.query.id) {
                try {
                    this.imagestore.store(req.query.id, req.body, req.params.project);
                    res.status(200).send({});
                } catch (e) {
                    if (e.code === 'ENOENT'){
                        res.status(404).send({reason: 'Image files not found.'});
                    } else {
                        console.log(e);
                        res.status(500).send({reason: 'Whoops?'});
                    }
                }
            } else {
                res.status(400).send({reason: 'Missing parameter "id".'});
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
            },
        }));

        await app.listen(3000, () => {
            console.log('PouchDB Server is listening on port 3000');
        });
    }

    private parseFileType(query: string): ImageVariant|null {
        if (query === 'original') {
            return ImageVariant.ORIGINAL;
        } else if (query === 'thumbnail') {
            return ImageVariant.THUMBNAIL;
        } else {
            return undefined;
        }
    }
}
