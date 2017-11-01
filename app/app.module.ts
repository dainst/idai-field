import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {ReadDatastore} from 'idai-components-2/datastore';
import {IdaiMessagesModule, MD, Messages} from 'idai-components-2/messages';
import {DocumentEditChangeMonitor, IdaiDocumentsModule} from 'idai-components-2/documents';
import {Validator} from 'idai-components-2/persist';
import {IdaiFieldValidator} from './core/model/idai-field-validator';
import {ConfigLoader, ProjectConfiguration} from 'idai-components-2/configuration';
import {routing} from './app.routing';
import {M} from './m';
import {AppComponent} from './app.component';
import {ResourcesModule} from './components/resources/resources.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Imagestore} from './core/imagestore/imagestore';
import {ReadImagestore} from './core/imagestore/read-imagestore';
import {ImageOverviewModule} from './components/imageoverview/image-overview.module';
import {NavbarComponent} from './components/navbar/navbar.component';
import {BlobMaker} from './core/imagestore/blob-maker';
import {Converter} from './core/imagestore/converter';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {SettingsModule} from './components/settings/settings.module';
import {IdaiFieldAppConfigurator} from 'idai-components-2/idai-field-model';
import {SettingsService} from './core/settings/settings-service';
import {TaskbarComponent} from './components/navbar/taskbar.component';
import {WidgetsModule} from './widgets/widgets.module';
import {ImageTypeUtility} from './common/image-type-utility';
import {PouchDbFsImagestore} from './core/imagestore/pouch-db-fs-imagestore';
import {AppState} from './core/settings/app-state';
import {ProjectsComponent} from './components/navbar/projects.component';
import {ImportModule} from './components/import/import-module';
import {ExportModule} from './components/export/export.module';
import {DoceditActiveTabService} from './components/docedit/docedit-active-tab-service';
import {ImageViewModule} from './components/imageview/image-view.module';
import {StateSerializer} from './common/state-serializer';
import {AppController} from "./app-controller";
import {DatastoreModule} from "./core/datastore/datastore.module";
import {IdaiFieldDocumentDatastore} from "./core/datastore/idai-field-document-datastore";
import {PersistenceManager} from "./core/persist/persistence-manager";
import {DocumentDatastore} from "./core/datastore/document-datastore";


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
        DatastoreModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        ProjectsComponent
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [IdaiFieldAppConfigurator, ConfigLoader, SettingsService],
            useFactory: function(appConfigurator: IdaiFieldAppConfigurator, configLoader: ConfigLoader, settingsService: SettingsService) {

                return() => {
                    const PROJECT_CONFIGURATION_PATH = remote.getGlobal('configurationPath');
                    appConfigurator.go(PROJECT_CONFIGURATION_PATH);

                    return configLoader.getProjectConfiguration().then(pc => {
                        pconf = pc;
                    }).catch(msgsWithParams => {

                        msgsWithParams.forEach(msg => {
                            console.error("err in project configuration", msg)
                        });
                        if (msgsWithParams.length > 1) {
                            console.error('num errors in project configuration', msgsWithParams.length);
                        }
                    })
                    .then(() => settingsService.init());
                }
            }
        },
        AppState,
        SettingsService,
        {
            provide: Messages,
            useFactory: function(md: MD) {
                return new Messages(md, remote.getGlobal('switches').messages_timeout);
            },
            deps: [MD]
        },
        ImageTypeUtility,
        { provide: Imagestore, useClass: PouchDbFsImagestore },
        { provide: ReadImagestore, useExisting: Imagestore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        BlobMaker,
        Converter,
        AppController,
        IdaiFieldAppConfigurator,
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
            useFactory: function(configLoader: ConfigLoader, datastore: IdaiFieldDocumentDatastore) {
                return new IdaiFieldValidator(configLoader, datastore);
            },
            deps: [ConfigLoader, DocumentDatastore]
        },
        { provide: MD, useClass: M},
        DoceditActiveTabService,
        StateSerializer,
        ImageTypeUtility
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }