import {NgModule} from '@angular/core';
import {Datastore, Document, ReadDatastore} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {DocumentCache} from './core/document-cache';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {ConstraintIndexer} from './index/constraint-indexer';
import {FulltextIndexer} from './index/fulltext-indexer';
import {PouchdbServerDatastore} from './pouchdb-server-datastore';
import {PouchdbManager} from './core/pouchdb-manager';
import {IdaiFieldDocumentDatastore} from './field/idai-field-document-datastore';
import {IdaiFieldDocumentReadDatastore} from './field/idai-field-document-read-datastore';
import {IdaiFieldImageDocumentDatastore} from './field/idai-field-image-document-datastore';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from './field/idai-field-image-document-read-datastore';
import {TypeConverter} from './core/type-converter';
import {IdaiFieldSampleDataLoader} from './field/idai-field-sample-data-loader';
import {SampleDataLoader} from './core/sample-data-loader';
import {DocumentDatastore} from './document-datastore';
import {DocumentReadDatastore} from './document-read-datastore';
import {IdaiFieldTypeConverter} from './field/idai-field-type-converter';
import {RemoteChangesStream} from './core/remote-changes-stream';
import {IndexFacade} from './index/index-facade';
import {IdGenerator} from './core/id-generator';
import {IdaiFieldFeatureDocumentDatastore} from './field/idai-field-feature-document-datastore';
import {IdaiFieldFeatureDocumentReadDatastore} from './field/idai-field-feature-document-read-datastore';
import {IdaiFieldFeatureDocument} from '../model/idai-field-feature-document';

/**
 * There is the top level package, in which everything idai-field specific resides,
 * IdaiFieldDocument, IdaiFieldImageDocument related stuff for example.
 *
 * There is the core package. This is meant to be more general purpose.
 */
@NgModule({
    providers: [
        RemoteChangesStream,

        { provide: SampleDataLoader, useClass: IdaiFieldSampleDataLoader },

        { provide: PouchdbManager, useFactory: function(
            sampleDataLoader: SampleDataLoader,
            indexFacade: IndexFacade
        ){
            return new PouchdbManager(
                sampleDataLoader,
                indexFacade);
        },
            deps: [SampleDataLoader, IndexFacade]
        },

        { provide: TypeConverter, useClass: IdaiFieldTypeConverter },

        {
            provide: FulltextIndexer,
            useFactory: function () {
                return new FulltextIndexer(true);
            }
        },
        {
            provide: ConstraintIndexer,
            useFactory: function() {
                return new ConstraintIndexer({
                    'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
                    'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
                    'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
                    'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' },
                    'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' },
                    'identifier:match': { path: 'resource.identifier', type: 'match' },
                    'id:match': { path: 'resource.id', type: 'match' },
                    'georeference:exist': { path: 'resource.georeference', type: 'exist' },
                    'conflicts:exist': { path: '_conflicts', type: 'exist' }
                }, true);
            }
        },
        DocumentCache,
        {
            provide: IndexFacade,
            useFactory: function (fulltextIndexer: FulltextIndexer, constraintIndexer: ConstraintIndexer) {
                return new IndexFacade(constraintIndexer, fulltextIndexer);
            },
            deps: [FulltextIndexer, ConstraintIndexer]
        },

        IdGenerator,
        {
            provide: PouchdbDatastore,
            useFactory: function(pouchdbManager: PouchdbManager,
                                 idGenerator: IdGenerator): PouchdbDatastore {

                return new PouchdbServerDatastore(pouchdbManager.getDbProxy(), // Provides fauxton
                    idGenerator);
            },
            deps: [PouchdbManager, IdGenerator]
        },


        // It is important to note that we only have one instance of a pouchdbdatastore and
        // only one instance of a document cache running, however, we have different 'wrapper'
        // objects which are basically all instances of CachedDatastore with litte extensions
        // to make sure the correct queries (constraints, correct types of objects) are issued
        // and only the documents of the correct types are returned. All of these datastore
        // 'wrappers' come with the full set of constraints, since the
        // constraints are configured directly in the PouchdbDatastore.


        // NOTE: When choosing a datastore instance one should always try to use the most
        // specific instance. For example if you need read acces to only IdaiFieldImageDocuments,
        // choose IdaiFieldImageDocumentReadDatastore. Avoid using Datastore and ReadDatastore.
        // They are for components-2 internal use.


        // basic idai-field datastore
        // knows only Document
        // guarantees that identifier, liesWithin, isRecordedIn constraints are available
        // provides caching
        {
            provide: DocumentDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<Document>,
                                 documentConverter: TypeConverter<Document>,
            ): DocumentDatastore {
                return new DocumentDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: DocumentReadDatastore, useExisting: DocumentDatastore },
        { provide: Datastore, useExisting: DocumentDatastore },     // used by components-2 lib
        { provide: ReadDatastore, useExisting: DocumentDatastore }, // used by components-2 lib


        // idai-field datastore
        // knows IdaiFieldDocument, guarantees for its instances to be null-checked, i.e. all declared fields are defined
        // guarantees that identifier, liesWithin, isRecordedIn constraints are available
        // provides caching
        {
            provide: IdaiFieldDocumentDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiFieldDocument>,
                                 documentConverter: TypeConverter<IdaiFieldDocument>
            ): IdaiFieldDocumentDatastore {
                return new IdaiFieldDocumentDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: IdaiFieldDocumentReadDatastore, useExisting: IdaiFieldDocumentDatastore }, // read-only version of it


        // idai-field datastore
        // knows IdaiFieldImageDocument, guarantees for its instances to be null-checked, i.e. all declared fields are defined
        // guarantees that identifier constraint is available
        // provides caching
        {
            provide: IdaiFieldImageDocumentDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiFieldImageDocument>,
                                 documentConverter: TypeConverter<IdaiFieldImageDocument>,
            ): IdaiFieldImageDocumentDatastore {
                return new IdaiFieldImageDocumentDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
                },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: IdaiFieldImageDocumentReadDatastore, useExisting: IdaiFieldImageDocumentDatastore }, // read-only version of it


        // idai-field datastore
        // knows IdaiFieldFeatureDocument, guarantees for its instances to be null-checked, i.e. all declared fields are defined
        // guarantees that identifier constraint is available
        // provides caching
        {
            provide: IdaiFieldFeatureDocumentDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiFieldFeatureDocument>,
                                 documentConverter: TypeConverter<IdaiFieldFeatureDocument>,
            ): IdaiFieldFeatureDocumentDatastore {
                return new IdaiFieldFeatureDocumentDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: IdaiFieldFeatureDocumentReadDatastore, useExisting: IdaiFieldFeatureDocumentDatastore }, // read-only version of it
    ]
})

export class DatastoreModule {}