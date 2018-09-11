import {IdaiFieldDocument, ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldImageDocumentDatastore} from '../../../app/core/datastore/field/idai-field-image-document-datastore';
import {IdaiFieldDocumentDatastore} from '../../../app/core/datastore/field/idai-field-document-datastore';
import {DocumentDatastore} from '../../../app/core/datastore/document-datastore';
import {IdaiFieldTypeConverter} from '../../../app/core/datastore/field/idai-field-type-converter';
import {TypeUtility} from '../../../app/core/model/type-utility';
import {PouchdbDatastore} from '../../../app/core/datastore/core/pouchdb-datastore';
import {PouchdbManager} from '../../../app/core/datastore/core/pouchdb-manager';
import {DocumentCache} from '../../../app/core/datastore/core/document-cache';
import {IndexerConfiguration} from '../../../app/indexer-configuration';


class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}

/**
 * @author Daniel de Oliveira
 */
export class DAOsHelper {

    public idaiFieldImageDocumentDatastore: IdaiFieldImageDocumentDatastore;
    public idaiFieldDocumentDatastore: IdaiFieldDocumentDatastore;
    public documentDatastore: DocumentDatastore;

    private projectConfiguration = new ProjectConfiguration({
        'types': [
            {
                'type': 'Trench',
                'fields': []
            },
            {
                'type': 'Image',
                'fields': []
            }
        ]
    });


    public async init(projectConfiguration?: ProjectConfiguration) {

        if (projectConfiguration) this.projectConfiguration = projectConfiguration;

        const {datastore, documentCache, indexFacade} = await this.createPouchdbDatastore('testdb');
        const converter = new IdaiFieldTypeConverter(
            new TypeUtility(this.projectConfiguration));


        this.idaiFieldImageDocumentDatastore = new IdaiFieldImageDocumentDatastore(
            datastore, indexFacade, documentCache as any, converter);
        this.idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
            datastore, indexFacade, documentCache, converter);
        this.documentDatastore = new DocumentDatastore(
            datastore, indexFacade, documentCache, converter);

        return {datastore, documentCache, indexFacade};
    }


    public async createPouchdbDatastore(dbname) {

        const {createdIndexFacade} =
            IndexerConfiguration.configureIndexers(this.projectConfiguration);

        const documentCache = new DocumentCache<IdaiFieldDocument>();
        const pouchdbManager = new PouchdbManager();

        const datastore = new PouchdbDatastore(
            pouchdbManager.getDbProxy(),
            new IdGenerator(),
            false);
        await pouchdbManager.loadProjectDb(dbname, undefined);

        const indexFacade = createdIndexFacade;
        return {
            datastore,
            documentCache,
            indexFacade
        }
    }
}