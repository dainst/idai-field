import { NgModule } from '@angular/core';
import {settings} from 'cluster';
import { CategoryConverter, ChangesStream, Datastore, DocumentCache, IdGenerator, IndexFacade, PouchdbDatastore, PouchdbManager, ProjectConfiguration } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';
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
        {
            provide: ChangesStream,
            useFactory: function(pouchdbDatastore: PouchdbDatastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache,
                                 documentConverter: CategoryConverter,
                                 settingsProvider: SettingsProvider
            ): ChangesStream {

                return new ChangesStream(
                    pouchdbDatastore, indexFacade, documentCache, documentConverter,
                    () => settingsProvider.getSettings().username
                );
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, CategoryConverter, SettingsProvider]
        },
        {
            provide: PouchdbManager,
            useFactory: () => new PouchdbManager((name: string) => new PouchDB(name))
        },
        PouchdbServer,
        {
            provide: CategoryConverter,
            useFactory: function(projectConfiguration: ProjectConfiguration) {

                return new CategoryConverter(projectConfiguration);
            },
            deps: [ProjectConfiguration]
        },
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
                                 settingsProvider: SettingsProvider
            ): Datastore {
                return new Datastore(
                    pouchdbDatastore,
                    indexFacade,
                    documentCache,
                    documentConverter,
                    () => settingsProvider.getSettings().username);
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, CategoryConverter, SettingsProvider]
        }
    ]
})

export class DatastoreModule {}
