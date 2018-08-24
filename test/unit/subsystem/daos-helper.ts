import {ProjectConfiguration, IdaiFieldDocument, Document, NewDocument} from 'idai-components-2';
import {IdaiFieldImageDocumentDatastore} from '../../../app/core/datastore/field/idai-field-image-document-datastore';
import {IdaiFieldDocumentDatastore} from '../../../app/core/datastore/field/idai-field-document-datastore';
import {DocumentDatastore} from '../../../app/core/datastore/document-datastore';
import {IdaiFieldTypeConverter} from '../../../app/core/datastore/field/idai-field-type-converter';
import {TypeUtility} from '../../../app/core/model/type-utility';
import {PouchdbDatastore} from '../../../app/core/datastore/core/pouchdb-datastore';
import {IndexFacade} from '../../../app/core/datastore/index/index-facade';
import {PouchdbManager} from '../../../app/core/datastore/core/pouchdb-manager';
import {DocumentCache} from '../../../app/core/datastore/core/document-cache';
import {ConstraintIndexer} from '../../../app/core/datastore/index/constraint-indexer';
import {FulltextIndexer} from '../../../app/core/datastore/index/fulltext-indexer';


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

    constructor(projectConfiguration?: ProjectConfiguration) {}



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




    public createIndexers() {

        const constraintIndexer = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' }
        }, this.projectConfiguration, false);
        const fulltextIndexer = new FulltextIndexer(this.projectConfiguration, false);
        return [constraintIndexer, fulltextIndexer] as [ConstraintIndexer, FulltextIndexer];
    }


    public async createPouchdbDatastore(dbname) {

        const [constraintIndexer, fulltextIndexer] = this.createIndexers();

        const documentCache = new DocumentCache<IdaiFieldDocument>();
        const indexFacade = new IndexFacade(constraintIndexer, fulltextIndexer);
        const pouchdbManager = new PouchdbManager();

        const datastore = new PouchdbDatastore(
            pouchdbManager.getDbProxy(),
            new IdGenerator(),
            false);
        await pouchdbManager.loadProjectDb(dbname, undefined);

        return {
            datastore: datastore,
            documentCache: documentCache,
            indexFacade: indexFacade
        }
    }
}