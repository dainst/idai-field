import { NgModule } from '@angular/core';
import { CategoryConverter, Datastore, Document, DocumentCache, DocumentDatastore, FeatureDocument, FieldDocument, IdGenerator, ImageDocument, IndexFacade, PouchdbDatastore, PouchdbManager } from 'idai-field-core';
import { ChangesStream } from './changes/changes-stream';
import { FieldCategoryConverter } from './field/field-category-converter';
import { ImageDatastore } from './field/image-datastore';
import { PouchdbServer } from './pouchdb/pouchdb-server';

const PouchDB = window.require('pouchdb-browser');

/**
 * There is the top level package, in which everything idai-field specific resides,
 * FieldDocument, ImageDocument related stuff for example.
 *
 * There is the core package. This is meant to be more general purpose.
 */
@NgModule({
    providers: [
        ChangesStream,
        {
            provide: PouchdbManager,
            useFactory: () => new PouchdbManager((name: string) => new PouchDB(name))
        },
        PouchdbServer,
        { provide: CategoryConverter, useClass: FieldCategoryConverter },
        DocumentCache,
        IdGenerator,
        {
            provide: PouchdbDatastore,
            useFactory: function(pouchdbManager: PouchdbManager,
                                 idGenerator: IdGenerator): PouchdbDatastore {

                return new PouchdbDatastore(pouchdbManager.getDb(), idGenerator);
            },
            deps: [PouchdbManager, IdGenerator]
        },


        // It is important to note that we only have one instance of a pouchdbdatastore and
        // only one instance of a document cache running, however, we have different 'wrapper'
        // objects which are basically all instances of CachedDatastore with litte extensions
        // to make sure the correct queries (constraints, correct categories of objects) are issued
        // and only the documents of the correct categories are returned. All of these datastore
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
                                 documentConverter: CategoryConverter<Document>,
            ): DocumentDatastore {
                return new DocumentDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, CategoryConverter]
        },
        { provide: Datastore, useExisting: DocumentDatastore },


        // idai-field datastore
        // knows ImageDocument, guarantees for its instances to be null-checked, i.e. all declared fields are defined
        // guarantees that identifier constraint is available
        // provides caching
        {
            provide: ImageDatastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache<ImageDocument>,
                                 documentConverter: CategoryConverter<ImageDocument>,
            ): ImageDatastore {
                return new ImageDatastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
                },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, CategoryConverter]
        }
    ]
})

export class DatastoreModule {}
