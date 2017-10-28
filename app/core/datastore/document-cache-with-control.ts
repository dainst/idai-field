/// <reference path="express-import" />

import {Injectable} from "@angular/core";
import * as express from 'express';

const remote = require('electron').remote;
const expressPouchDB = require('express-pouchdb');

import {DocumentCache} from "./document-cache";
import {PouchdbManager} from "./core/pouchdb-manager";
import {Document} from 'idai-components-2/core';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class DocumentCacheWithControl<T extends Document> extends DocumentCache<T> {

    constructor(private pouchdbManager: PouchdbManager) {
        super();
        this.setupServer();
    }

    private setupServer(): Promise<any> {
        return new Promise((resolve, reject) => {

            const control = express();
            control.post('/reset', (req: any, res: any) => {
                this._ = { };
                this.pouchdbManager.resetTest();
                res.send('done');
            });
            control.listen(3003, function() {
                console.log('App Control listening on port 3003');
                resolve();
            });
        })
    }

}