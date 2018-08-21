import {NgModule} from '@angular/core';
import {Datastore, Document, ReadDatastore} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {DocumentCache} from './core/document-cache';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {PouchdbServerDatastore} from './pouchdb-server-datastore';
import {PouchdbManager} from './core/pouchdb-manager';
import {IdaiFieldDocumentDatastore} from './field/idai-field-document-datastore';
import {IdaiFieldDocumentReadDatastore} from './field/idai-field-document-read-datastore';
import {IdaiFieldImageDocumentDatastore} from './field/idai-field-image-document-datastore';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {IdaiFieldImageDocumentReadDatastore} from './field/idai-field-image-document-read-datastore';
import {TypeConverter} from './core/type-converter';
import {DocumentDatastore} from './document-datastore';
import {DocumentReadDatastore} from './document-read-datastore';
import {IdaiFieldTypeConverter} from './field/idai-field-type-converter';
import {RemoteChangesStream} from './core/remote-changes-stream';
import {IndexFacade} from './index/index-facade';
import {IdGenerator} from './core/id-generator';
import {IdaiFieldFeatureDocumentDatastore} from './field/idai-field-feature-document-datastore';
import {IdaiFieldFeatureDocumentReadDatastore} from './field/idai-field-feature-document-read-datastore';
import {IdaiFieldFeatureDocument} from 'idai-components-2';

/**
 * There is the top level package, in which everything idai-field specific resides,
 * IdaiFieldDocument, IdaiFieldImageDocument related stuff for example.
 *
 * There is the core package. This is meant to be more general purpose.
 */
@NgModule({
    providers: [
        RemoteChangesStream,
        PouchdbManager,
        { provide: TypeConverter, useClass: IdaiFieldTypeConverter },
        DocumentCache,
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