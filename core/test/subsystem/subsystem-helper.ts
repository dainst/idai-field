import {Document} from '../../src/model/document';
import {AppConfigurator} from '../../src/configuration/app-configurator';
import {ConfigLoader} from '../../src/configuration/boot/config-loader';
import {ConfigReader} from '../../src/configuration/boot/config-reader';
import {CategoryConverter} from '../../src/datastore/category-converter';
import {Datastore} from '../../src/datastore/datastore';
import {DocumentCache} from '../../src/datastore/document-cache';
import {PouchdbDatastore} from '../../src/datastore/pouchdb/pouchdb-datastore';
import { PouchdbManager } from '../../src/datastore/pouchdb/pouchdb-manager';
import {ConstraintIndex} from '../../src/index/constraint-index';
import {IndexFacade} from '../../src/index/index-facade';
import {Tree} from '../../src/tools/forest';
import {Lookup, makeLookup, Name} from '../../src/tools';
import {RelationsManager} from '../../src/model';
import {createDocuments, makeExpectDocuments, NiceDocs} from '../test-helpers';

import PouchDB = require('pouchdb-node');


// TODO remove duplication with import/utils.ts
export const makeDocumentsLookup: (ds: Array<Document>) => Lookup<Document> = makeLookup(['resource', 'id']);


class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}


export interface CoreApp {

    datastore: Datastore,
    relationsManager: RelationsManager
}


export async function createCoreApp(user: Name = 'testuser', db: Name = 'testdb'): Promise<CoreApp> {

    const pouchdbManager = new PouchdbManager((name: string) => new PouchDB(name));

    const project = {
        _id: 'project',
        resource: {
            category: 'Project',
            identifier: db,
            id: 'project',
            coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
            relations: {}
        },
        created: { user: db, date: new Date() },
        modified: [{ user: db, date: new Date() }]
    };

    await pouchdbManager.createDb(db, project, true);

    const pouchdbDatastore = new PouchdbDatastore(
        pouchdbManager.getDb(),
        new IdGenerator(),
        false);

    const documentCache = new DocumentCache();
    
    const configLoader = new ConfigLoader(
        new ConfigReader(), 
        pouchdbManager,
    );

    const appConfigurator = new AppConfigurator(configLoader);

    const projectConfiguration = await appConfigurator.go(
        user,
        undefined
    );

    const createdConstraintIndex = ConstraintIndex.make({
        'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', pathArray: ['resource', 'relations', 'isRecordedIn'], type: 'contain' },
        'liesWithin:contain': { path: 'resource.relations.liesWithin', pathArray: ['resource', 'relations', 'liesWithin'], type: 'contain', recursivelySearchable: true },
        'liesWithin:exist': { path: 'resource.relations.liesWithin', pathArray: ['resource', 'relations', 'liesWithin'], type: 'exist' },
        'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' },
        'id:match': { path: 'resource.id', pathArray: ['resource', 'id'], type: 'match' },
    }, Tree.flatten(projectConfiguration.getCategories()));

    const createdFulltextIndex = {};
    const createdIndexFacade = new IndexFacade(
        createdConstraintIndex,
        createdFulltextIndex,
        Tree.flatten(projectConfiguration.getCategories()),
        false
    );

    const categoryConverter = new CategoryConverter(projectConfiguration);
    const datastore = new Datastore(
        pouchdbDatastore, createdIndexFacade, documentCache, categoryConverter);
    
    const relationsManager = new RelationsManager(datastore, projectConfiguration, () => user)

    return {
        datastore,
        relationsManager
    };
}


export function createHelpers(app: CoreApp, user: Name = 'testuser') {

    const createDocuments = makeCreateDocuments(app.datastore, user);
    const expectDocuments = makeExpectDocuments(app.datastore);

    return {
        createDocuments,
        expectDocuments
    }
}


function makeCreateDocuments(datastore: Datastore,
                             username: string) {

    return async function create(documents: NiceDocs) {

        const documentsLookup = createDocuments(documents);
        for (const document of Object.values(documentsLookup)) {
            await datastore.create(document, username);
        }

        const storedDocuments = [];
        for (const doc of Object.values(documentsLookup)) {
            storedDocuments.push( await datastore.get(doc.resource.id) );
        }
        return makeDocumentsLookup(storedDocuments);
    }
}
