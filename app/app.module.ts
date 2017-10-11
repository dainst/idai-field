import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {Datastore, ReadDatastore} from 'idai-components-2/datastore';
import {IdaiMessagesModule, MD, Messages} from 'idai-components-2/messages';
import {DocumentEditChangeMonitor, IdaiDocumentsModule} from 'idai-components-2/documents';
import {PersistenceManager, Validator} from 'idai-components-2/persist';
import {IdaiFieldValidator} from './model/idai-field-validator';
import {ConfigLoader, ProjectConfiguration} from 'idai-components-2/configuration';
import {routing} from './app.routing';
import {IdaiFieldDatastore} from './datastore/idai-field-datastore';
import {M} from './m';
import {AppComponent} from './app.component';
import {ResourcesModule} from './resources/resources.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Imagestore} from './imagestore/imagestore';
import {ReadImagestore} from './imagestore/read-imagestore';
import {ImageOverviewModule} from './imageoverview/image-overview.module';
import {NavbarComponent} from './navbar.component';
import {CachedPouchdbDatastore} from './datastore/cached-pouchdb-datastore';
import {BlobMaker} from './imagestore/blob-maker';
import {Converter} from './imagestore/converter';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {SettingsModule} from './settings/settings.module';
import {AppConfigurator} from 'idai-components-2/idai-field-model';
import {SettingsService} from './settings/settings-service';
import {PouchdbServerDatastore} from './datastore/pouchdb-server-datastore';
import {TaskbarComponent} from './taskbar.component';
import {WidgetsModule} from './widgets/widgets.module';
import {ImageTypeUtility} from './docedit/image-type-utility';
import {ViewUtility} from './common/view-utility';
import {PouchdbManager} from './datastore/pouchdb-manager';
import {PouchDbFsImagestore} from './imagestore/pouch-db-fs-imagestore';
import {SampleDataLoader} from './datastore/sample-data-loader';
import {ConstraintIndexer} from './datastore/constraint-indexer';
import {FulltextIndexer} from './datastore/fulltext-indexer';
import {DocumentCache} from './datastore/document-cache';
import {AppState} from './app-state';
import {ConflictResolvingExtension} from './datastore/conflict-resolving-extension';
import {IdaiFieldConflictResolver} from './model/idai-field-conflict-resolver';
import {ConflictResolver} from './datastore/conflict-resolver';
import {ProjectsComponent} from './projects.component';

import {ImportModule} from './import/import-module';
import {ExportModule} from './export/export.module';
import {DoceditActiveTabService} from './docedit/docedit-active-tab-service';
import {ImageViewModule} from './imageview/image-view.module';
const remote = require('electron').remote;

let pconf = undefined;

@NgModule({
    imports: [
        ImageOverviewModule,
        ImageViewModule,
        ResourcesModule,
        SettingsModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        NgbModule.forRoot(),
        IdaiDocumentsModule,
        IdaiMessagesModule,
        routing,
        IdaiWidgetsModule,
        WidgetsModule,
        ImportModule,
        ExportModule,
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        ProjectsComponent
    ],
    providers: [
        AppState,
        { provide: ConflictResolver, useClass: IdaiFieldConflictResolver },
        ConflictResolvingExtension,
        SettingsService,
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
        FulltextIndexer,
        DocumentCache,
        SampleDataLoader,
        { provide: PouchdbManager, useFactory: function(
                sampleDataLoader: SampleDataLoader,
                constraintIndexer: ConstraintIndexer,
                fulltextIndexer: FulltextIndexer,
                documentCache: DocumentCache
            ){
                return new PouchdbManager(
                    sampleDataLoader,
                    constraintIndexer,
                    fulltextIndexer,
                    documentCache);
            },
            deps: [SampleDataLoader, ConstraintIndexer, FulltextIndexer, DocumentCache]
        },
        { provide: Imagestore, useClass: PouchDbFsImagestore },
        { provide: ReadImagestore, useExisting: Imagestore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        {
            provide: Datastore,
            useFactory: function(pouchdbManager: PouchdbManager,
                                 constraintIndexer: ConstraintIndexer,
                                 fulltextIndexer: FulltextIndexer,
                                 documentCache: DocumentCache,
                                 appState: AppState,
                                 autoConflictResolvingExtension: ConflictResolvingExtension,
                                 conflictResolver: ConflictResolver): Datastore {
                return new CachedPouchdbDatastore(
                    new PouchdbServerDatastore(pouchdbManager,
                        constraintIndexer, fulltextIndexer,
                        appState, autoConflictResolvingExtension, conflictResolver),
                    documentCache);
            },
            deps: [PouchdbManager, ConstraintIndexer,
                FulltextIndexer, DocumentCache,
                AppState, ConflictResolvingExtension, ConflictResolver]
        },
        { provide: ReadDatastore, useExisting: Datastore },
        { provide: IdaiFieldDatastore, useExisting: Datastore },
        { provide: CachedPouchdbDatastore, useExisting: Datastore },
        Messages,
        BlobMaker,
        Converter,
        AppConfigurator,
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [AppConfigurator, ConfigLoader, SettingsService],
            useFactory: function(appConfigurator: AppConfigurator, configLoader: ConfigLoader, settingsService: SettingsService) {

                return() => {
                    const PROJECT_CONFIGURATION_PATH = remote.getGlobal('configurationPath');
                    appConfigurator.go(PROJECT_CONFIGURATION_PATH);

                    return configLoader.getProjectConfiguration().then(pc => {
                        pconf = pc;
                    }).catch(() => {}) // errors are handled in AppComponent
                    .then(() => settingsService.init());
                }
            }
        },
        ConfigLoader,
        {
            provide: ProjectConfiguration,
            useFactory: () => {
                if (!pconf) {
                    console.error("pconf has not yet been provided");
                    throw "pconf has not yet been provided";
                }
                return pconf;
            },
            deps: []
        },
        PersistenceManager,
        DocumentEditChangeMonitor,
        {
            provide: Validator,
            useFactory: function(configLoader: ConfigLoader, datastore: IdaiFieldDatastore) {
                return new IdaiFieldValidator(configLoader, datastore);
            },
            deps: [ConfigLoader, ReadDatastore]
        },
        { provide: MD, useClass: M},
        ImageTypeUtility,
        ViewUtility,
        DoceditActiveTabService
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }