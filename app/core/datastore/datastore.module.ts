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
import {DocumentDatastore} from "./core/document-datastore";
import {ImageTypeUtility} from "../../common/image-type-utility";
import {Document} from 'idai-components-2/core';
import {DocumentReadDatastore} from "./core/document-read-datastore";
import {IdaiFieldDocumentDatastore} from "./idai-field-document-datastore";
import {Datastore, ReadDatastore} from "idai-components-2/datastore";
import {IdaiFieldDocument} from "idai-components-2/idai-field-model";
import {IdaiFieldDocumentReadDatastore} from "./idai-field-document-read-datastore";
import {IdaiFieldImageDocumentDatastore} from "./idai-field-image-document-datastore";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {IdaiFieldImageDocumentReadDatastore} from "./idai-field-image-document-read-datastore";
import {DocumentConverter} from "./core/document-converter";
import {IdaiFieldDocumentConverter} from "./idai-field-document-converter";
import {IdaiFieldSampleDataLoader} from "./idai-field-sample-data-loader";
import {SampleDataLoader} from "./core/sample-data-loader";
import {IdaiFieldConflictResolver} from "../model/idai-field-conflict-resolver";

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
        DocumentCache,
        {
            provide: DocumentConverter,
            useFactory: function(imageTypeUtility: ImageTypeUtility): DocumentConverter {
                return new IdaiFieldDocumentConverter(imageTypeUtility);
            },
            deps: [ImageTypeUtility] // TODO make abstract base class TypeUtility to not depend on common here directly
        },
        {
            provide: PouchdbDatastore,
            useFactory: function(pouchdbManager: PouchdbManager,
                                 constraintIndexer: ConstraintIndexer,
                                 fulltextIndexer: FulltextIndexer,
                                 appState: AppState,
                                 autoConflictResolvingExtension: ConflictResolvingExtension,
                                 conflictResolver: ConflictResolver): PouchdbDatastore {
                return new PouchdbServerDatastore(pouchdbManager,
                    constraintIndexer, fulltextIndexer,
                    appState, autoConflictResolvingExtension, conflictResolver);
            },
            deps: [PouchdbManager, ConstraintIndexer,
                FulltextIndexer, AppState, ConflictResolvingExtension, ConflictResolver]
        },
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
        { provide: Datastore, useExisting: DocumentDatastore },
        { provide: ReadDatastore, useExisting: DocumentDatastore },
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
        { provide: IdaiFieldDocumentReadDatastore, useExisting: IdaiFieldDocumentDatastore },
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
        { provide: IdaiFieldImageDocumentReadDatastore, useExisting: IdaiFieldImageDocumentDatastore },
        { provide: ConflictResolver, useClass: IdaiFieldConflictResolver },
        ConflictResolvingExtension,
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
        FulltextIndexer
    ]
})

export class DatastoreModule {}