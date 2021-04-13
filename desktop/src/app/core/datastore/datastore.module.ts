import { NgModule } from '@angular/core';
import { CategoryConverter, DocumentCache, Datastore, IdGenerator, IndexFacade, PouchdbDatastore, PouchdbManager } from 'idai-field-core';
import { ChangesStream } from './changes/changes-stream';
import { FieldCategoryConverter } from './field/field-category-converter';
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

        // basic idai-field datastore
        // knows only Document
        // guarantees that identifier, liesWithin, isRecordedIn constraints are available
        // provides caching
        {
            provide: Datastore,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache,
                                 documentConverter: CategoryConverter,
            ): Datastore {
                return new Datastore(pouchdbDatastore, indexFacade, documentCache, documentConverter);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, CategoryConverter]
        }
    ]
})

export class DatastoreModule {}
