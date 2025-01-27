import { NgModule } from '@angular/core';
import { ChangesStream, Datastore, DocumentCache, IdGenerator, IndexFacade, PouchdbDatastore,
    ProjectConfiguration } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';
import { ExpressServer } from '../express-server';

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
                                 datastore: Datastore,
                                 indexFacade: IndexFacade,
                                 documentCache: DocumentCache,
                                 settingsProvider: SettingsProvider,
                                 projectConfiguration: ProjectConfiguration
            ): ChangesStream {

                return new ChangesStream(
                    pouchdbDatastore, datastore, indexFacade, documentCache, projectConfiguration,
                    () => settingsProvider.getSettings().username
                );
            },
            deps: [PouchdbDatastore, Datastore, IndexFacade, DocumentCache, SettingsProvider, ProjectConfiguration]
        },
        ExpressServer,
        DocumentCache,
        IdGenerator,
        {
            provide: PouchdbDatastore,
            useFactory: function(idGenerator: IdGenerator): PouchdbDatastore {

                return new PouchdbDatastore((name: string) => new PouchDB(name), idGenerator);
            },
            deps: [IdGenerator]
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
                                 settingsProvider: SettingsProvider,
                                 projectConfiguration: ProjectConfiguration
            ): Datastore {
                return new Datastore(
                    pouchdbDatastore,
                    indexFacade,
                    documentCache,
                    projectConfiguration,
                    () => settingsProvider.getSettings().username
                );
            },
            deps: [PouchdbDatastore, IndexFacade, DocumentCache, SettingsProvider, ProjectConfiguration]
        }
    ]
})

export class DatastoreModule {}
