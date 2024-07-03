import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as expressBasicAuth from 'express-basic-auth';
import * as expressPouchdb from 'express-pouchdb';
import * as fs from 'fs';
import * as pouchdb from 'pouchdb-node';


const modules = {
    '@electron/remote': undefined,
    'body-parser': bodyParser,
    'express': express,
    'express-basic-auth': expressBasicAuth,
    'express-pouchdb': expressPouchdb,
    'fs': fs,
    'pouchdb-browser': pouchdb
}

window.require = ((moduleName: string) => modules[moduleName]) as any;
