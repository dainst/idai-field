import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldImageDocumentDatastore} from "../../app/core/datastore/field/idai-field-image-document-datastore";
import {IdaiFieldDocumentDatastore} from "../../app/core/datastore/field/idai-field-document-datastore";
import {DocumentDatastore} from '../../app/core/datastore/document-datastore';
import {IdaiFieldTypeConverter} from "../../app/core/datastore/field/idai-field-type-converter";
import {PouchdbDatastore} from '../../app/core/datastore/core/pouchdb-datastore';
import {IndexFacade} from '../../app/core/datastore/index/index-facade';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {PouchdbManager} from '../../app/core/datastore/core/pouchdb-manager';
import {FulltextIndexer} from '../../app/core/datastore/index/fulltext-indexer';
import {IdGenerator} from '../../app/core/datastore/core/id-generator';
import {DocumentCache} from '../../app/core/datastore/core/document-cache';
import {ConstraintIndexer} from '../../app/core/datastore/index/constraint-indexer';
import {TypeUtility} from '../../app/core/model/type-utility';

/**
 * @author Daniel de Oliveira
 */
export class DAOsSpecHelper {

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

    constructor() {

        spyOn(console, 'debug'); // suppress console.debug

        const {datastore, documentCache, indexFacade} = DAOsSpecHelper.createPouchdbDatastore('testdb');
        const converter = new IdaiFieldTypeConverter(
            new TypeUtility(this.projectConfiguration));

        this.idaiFieldImageDocumentDatastore = new IdaiFieldImageDocumentDatastore(
            datastore, indexFacade, documentCache as any, converter);
        this.idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
            datastore, indexFacade, documentCache, converter);
        this.documentDatastore = new DocumentDatastore(
            datastore, indexFacade, documentCache, converter);
    }


    public static createIndexers() {

        const constraintIndexer = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' }
        }, false);
        const fulltextIndexer = new FulltextIndexer(false);
        return [constraintIndexer, fulltextIndexer] as [ConstraintIndexer, FulltextIndexer];
    }


    public static createPouchdbDatastore(dbname) {

        const [constraintIndexer, fulltextIndexer] = DAOsSpecHelper.createIndexers();

        const documentCache = new DocumentCache<IdaiFieldDocument>();
        const indexFacade = new IndexFacade(constraintIndexer, fulltextIndexer);
        const pouchdbManager = new PouchdbManager(indexFacade);


        const datastore = new PouchdbDatastore(
            pouchdbManager.getDbProxy(),
            new IdGenerator(),
            false);
        pouchdbManager.loadProjectDb(dbname, undefined);

        return {
            datastore: datastore,
            documentCache: documentCache,
            indexFacade: indexFacade
        }
    }
}