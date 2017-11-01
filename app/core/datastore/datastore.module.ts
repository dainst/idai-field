import {NgModule} from '@angular/core';
import {DocumentCache} from "./core/document-cache";
import {PouchdbDatastore} from "./core/pouchdb-datastore";
import {ConstraintIndexer} from "./core/constraint-indexer";
import {FulltextIndexer} from "./core/fulltext-indexer";
import {AppState} from "../settings/app-state";
import {ConflictResolvingExtension} from "./core/conflict-resolving-extension";
import {ConflictResolver} from "./core/conflict-resolver";
import {PouchdbServerDatastore} from "./pouchdb-server-datastore";
import {PouchdbManager} from "./core/pouchdb-manager";
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocumentDatastore} from "./idai-field-document-datastore";
import {IdaiFieldDocument} from "idai-components-2/idai-field-model";
import {IdaiFieldDocumentReadDatastore} from "./idai-field-document-read-datastore";
import {IdaiFieldImageDocumentDatastore} from "./idai-field-image-document-datastore";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {IdaiFieldImageDocumentReadDatastore} from "./idai-field-image-document-read-datastore";
import {DocumentConverter} from "./core/document-converter";
import {IdaiFieldSampleDataLoader} from "./idai-field-sample-data-loader";
import {SampleDataLoader} from "./core/sample-data-loader";
import {IdaiFieldConflictResolver} from "../model/idai-field-conflict-resolver";
import {DocumentDatastore} from "./document-datastore";
import {DocumentReadDatastore} from "./document-read-datastore";
import {IdaiFieldDocumentConverter} from "./idai-field-document-converter";
import {ReadDatastore, Datastore} from "idai-components-2/datastore";

/**
 * There is the top level package, in which everything idai-field specific resides,
 * IdaiFieldDocument, IdaiFieldImageDocument related stuff for example.
 *
 * There is the core package. This is meant to be more general purpose.
 */
@NgModule({
    providers: [
        // TODO place app state here, its a direct dependency of this package
        { provide: SampleDataLoader, useClass: IdaiFieldSampleDataLoader },

        { provide: PouchdbManager, useFactory: function(
            sampleDataLoader: SampleDataLoader,
            constraintIndexer: ConstraintIndexer,
            fulltextIndexer: FulltextIndexer
        ){
            return new PouchdbManager(
                sampleDataLoader,
                constraintIndexer,
                fulltextIndexer);
        },
            deps: [SampleDataLoader, ConstraintIndexer, FulltextIndexer]
        },

        { provide: ConflictResolver, useClass: IdaiFieldConflictResolver },
        { provide: DocumentConverter, useClass: IdaiFieldDocumentConverter },
        ConflictResolvingExtension,


        FulltextIndexer,
        {
            provide: ConstraintIndexer,
            useFactory: function() {
                return new ConstraintIndexer([
                    { path: 'resource.relations.isRecordedIn', type: 'contain' },
                    { path: 'resource.relations.liesWithin', type: 'contain' },
                    { path: 'resource.relations.depicts', type: 'exist' },
                    { path: 'resource.identifier', type: 'match' },
                    { path: '_conflicts', type: 'exist' }
                ]);
            }
        },
        DocumentCache,


        {
            provide: PouchdbDatastore,
            useFactory: function(pouchdbManager: PouchdbManager,
                                 constraintIndexer: ConstraintIndexer,
                                 fulltextIndexer: FulltextIndexer,
                                 appState: AppState,
                                 autoConflictResolvingExtension: ConflictResolvingExtension,
                                 conflictResolver: ConflictResolver): PouchdbDatastore {
                return new PouchdbServerDatastore(pouchdbManager, // Provides fauxton
                    constraintIndexer, fulltextIndexer,
                    appState, autoConflictResolvingExtension, conflictResolver);
            },
            deps: [PouchdbManager, ConstraintIndexer,
                FulltextIndexer, AppState, ConflictResolvingExtension, ConflictResolver]
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
                                 documentCache: DocumentCache<Document>,
                                 documentConverter: DocumentConverter,
            ): DocumentDatastore {
                return new DocumentDatastore(pouchdbDatastore, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, DocumentCache, DocumentConverter]
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
                                 documentCache: DocumentCache<IdaiFieldDocument>,
                                 documentConverter: DocumentConverter
            ): IdaiFieldDocumentDatastore {
                return new IdaiFieldDocumentDatastore(pouchdbDatastore, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, DocumentCache, DocumentConverter]
        },
        { provide: IdaiFieldDocumentReadDatastore, useExisting: IdaiFieldDocumentDatastore }, // read-only version of it


        // idai-field datastore
        // knows IdaiFieldImageDocument, guarantees for its instances to be null-checked, i.e. all declared fields are defined
        // guarantees that identifier constraint is available
        // provides caching
        {
            provide: IdaiFieldImageDocumentDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 documentCache: DocumentCache<IdaiFieldImageDocument>,
                                 documentConverter: DocumentConverter,
            ): IdaiFieldImageDocumentDatastore {
                return new IdaiFieldImageDocumentDatastore(pouchdbDatastore, documentCache, documentConverter);
                },
            deps: [PouchdbDatastore, DocumentCache, DocumentConverter]
        },
        { provide: IdaiFieldImageDocumentReadDatastore, useExisting: IdaiFieldImageDocumentDatastore }, // read-only version of it
    ]
})

export class DatastoreModule {}