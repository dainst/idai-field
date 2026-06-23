import { Document } from '../../src/model/document/document';
import { AppConfigurator } from '../../src/configuration/app-configurator';
import { ConfigLoader } from '../../src/configuration/boot/config-loader';
import { ConfigReader } from '../../src/configuration/boot/config-reader';
import { Datastore } from '../../src/datastore/datastore';
import { DocumentCache } from '../../src/datastore/document-cache';
import { PouchdbDatastore } from '../../src/datastore/pouchdb/pouchdb-datastore';
import { ConstraintIndex } from '../../src/index/constraint-index';
import { IndexFacade } from '../../src/index/index-facade';
import { Tree } from '../../src/tools/forest';
import { Lookup, makeLookup, Name } from '../../src/tools';
import { createDocuments, makeExpectDocuments, NiceDocs } from '../test-helpers';
import { basicIndexConfiguration } from '../../src/basic-index-configuration';
import { Template } from '../../src/model/configuration/template';
import { RelationsManager } from '../../src/services/relations-manager';
import { WarningsManager } from '../../src/warnings/warnings-manager';
import { WarningsUpdater } from '../../src/warnings/warnings-updater';

import PouchDB = require('pouchdb-node');

// TODO remove duplication with import/utils.ts
export const makeDocumentsLookup: (ds: Array<Document>) => Lookup<Document> = makeLookup(['resource', 'id']);


class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}


export interface CoreApp {

    datastore: Datastore;
    relationsManager: RelationsManager;
    warningsManager: WarningsManager;
}


export async function createCoreApp(user: Name = 'testuser', db: Name = 'testdb'): Promise<CoreApp> {

    const pouchdbDatastore = new PouchdbDatastore(
        (name: string) => new PouchDB(name),
        new IdGenerator()
    );

    const projectDocument = {
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

    const configLoader = new ConfigLoader(new ConfigReader());

    const template: Template = (await configLoader.readTemplates())['default'];

    const configurationDocument = {
        _id: 'configuration',
        resource: {
            category: 'Configuration',
            identifier: 'Configuration',
            id: 'configuration',
            forms: template.configuration.forms,
            order: template.configuration.order,
            valuelists: {},
            languages: {},
            projectLanguages: [],
            relations: {}
        },
        created: { user: db, date: new Date() },
        modified: [{ user: db, date: new Date() }]
    };

    await pouchdbDatastore.createDb(db, projectDocument, configurationDocument, true);

    const documentCache = new DocumentCache();

    const appConfigurator = new AppConfigurator(configLoader);

    const projectConfiguration = await appConfigurator.go(
        'test',
        configurationDocument
    );

    const constraintIndex = ConstraintIndex.make(
        basicIndexConfiguration, Tree.flatten(projectConfiguration.getCategories())
    );

    const warningsManager = new WarningsManager();

    const fulltextIndex = {};
    const indexFacade = new IndexFacade(
        constraintIndex,
        fulltextIndex,
        projectConfiguration,
        warningsManager,
        false
    );

    const warningsUpdater = new WarningsUpdater(warningsManager, indexFacade, documentCache, projectConfiguration);

    const datastore = new Datastore(
        pouchdbDatastore,
        indexFacade,
        documentCache,
        projectConfiguration,
        warningsUpdater,
        () => user
    );
    
    const relationsManager = new RelationsManager(datastore, projectConfiguration);

    return {
        datastore,
        relationsManager,
        warningsManager
    };
}


export function createHelpers(app: CoreApp, user: Name = 'testuser') {

    const createDocuments = makeCreateDocuments(app.datastore);
    const expectDocuments = makeExpectDocuments(app.datastore);

    return {
        createDocuments,
        expectDocuments
    }
}


function makeCreateDocuments(datastore: Datastore) {

    return async function create(documents: NiceDocs) {

        const documentsLookup = createDocuments(documents);
        for (const document of Object.values(documentsLookup)) {
            await datastore.create(document);
        }

        const storedDocuments = [];
        for (const doc of Object.values(documentsLookup)) {
            storedDocuments.push( await datastore.get(doc.resource.id));
        }
        return makeDocumentsLookup(storedDocuments);
    }
}
