import {NgModule} from '@angular/core';
import {Datastore, Document, ReadDatastore} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {DocumentCache} from './core/document-cache';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {PouchdbManager} from './core/pouchdb-manager';
import {FieldDatastore} from './field/field-datastore';
import {FieldReadDatastore} from './field/field-read-datastore';
import {ImageDatastore} from './field/image-datastore';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ImageReadDatastore} from './field/image-read-datastore';
import {TypeConverter} from './core/type-converter';
import {DocumentDatastore} from './document-datastore';
import {DocumentReadDatastore} from './document-read-datastore';
import {FieldTypeConverter} from './field/field-type-converter.service';
import {RemoteChangesStream} from './core/remote-changes-stream';
import {IndexFacade} from './index/index-facade';
import {IdGenerator} from './core/id-generator';
import {FeatureDatastore} from './field/feature-datastore';
import {FeatureReadDatastore} from './field/feature-read-datastore';
import {IdaiFieldFeatureDocument} from 'idai-components-2';
import {IdaiField3DDocumentDatastore} from './idai-field-3d-document-datastore';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';
import {IdaiField3DDocumentReadDatastore} from './idai-field-3d-document-read-datastore';
import {IdaiFieldMediaDocument} from '../model/idai-field-media-document';
import {IdaiFieldMediaDocumentDatastore} from './idai-field-media-document-datastore';
import {IdaiFieldMediaDocumentReadDatastore} from './idai-field-media-document-read-datastore';

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
        { provide: TypeConverter, useClass: FieldTypeConverter },
        DocumentCache,
        IdGenerator,
        {
            provide: PouchdbDatastore,
            useFactory: function(pouchdbManager: PouchdbManager,
                                 idGenerator: IdGenerator): PouchdbDatastore {

                return new PouchdbDatastore(pouchdbManager.getDbProxy(), idGenerator);
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
        // choose ImageReadDatastore. Avoid using Datastore and ReadDatastore.
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
            provide: FieldDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiFieldDocument>,
                                 documentConverter: TypeConverter<IdaiFieldDocument>
            ): FieldDatastore {
                return new FieldDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: FieldReadDatastore, useExisting: FieldDatastore }, // read-only version of it


        // idai-field datastore
        // knows IdaiFieldImageDocument, guarantees for its instances to be null-checked, i.e. all declared fields are defined
        // guarantees that identifier constraint is available
        // provides caching
        {
            provide: ImageDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiFieldImageDocument>,
                                 documentConverter: TypeConverter<IdaiFieldImageDocument>,
            ): ImageDatastore {
                return new ImageDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
                },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: ImageReadDatastore, useExisting: ImageDatastore }, // read-only version of it

        {
            provide: IdaiField3DDocumentDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiField3DDocument>,
                                 documentConverter: TypeConverter<IdaiField3DDocument>,
            ): IdaiField3DDocumentDatastore {
                return new IdaiField3DDocumentDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: IdaiField3DDocumentReadDatastore, useExisting: IdaiField3DDocumentDatastore },

        {
            provide: IdaiFieldMediaDocumentDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiFieldMediaDocument>,
                                 documentConverter: TypeConverter<IdaiFieldMediaDocument>
            ): IdaiFieldMediaDocumentDatastore {
                return new IdaiFieldMediaDocumentDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: IdaiFieldMediaDocumentReadDatastore, useExisting: IdaiFieldMediaDocumentDatastore },

        // idai-field datastore
        // knows IdaiFieldFeatureDocument, guarantees for its instances to be null-checked, i.e. all declared fields are defined
        // guarantees that identifier constraint is available
        // provides caching
        {
            provide: FeatureDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<IdaiFieldFeatureDocument>,
                                 documentConverter: TypeConverter<IdaiFieldFeatureDocument>,
            ): FeatureDatastore {
                return new FeatureDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, TypeConverter]
        },
        { provide: FeatureReadDatastore, useExisting: FeatureDatastore }, // read-only version of it
    ]
})

export class DatastoreModule {}