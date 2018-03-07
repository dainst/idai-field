import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {IdaiMessagesModule, MD, Messages} from 'idai-components-2/core';
import {DocumentEditChangeMonitor, IdaiDocumentsModule} from 'idai-components-2/core';
import {IdaiFieldValidator} from './core/model/idai-field-validator';
import {ConfigReader, ConfigLoader, ProjectConfiguration} from 'idai-components-2/core';
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
import {IdaiFieldAppConfigurator} from 'idai-components-2/field';
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
import {AppController} from './app-controller';
import {DatastoreModule} from './core/datastore/datastore.module';
import {IdaiFieldDocumentDatastore} from './core/datastore/idai-field-document-datastore';
import {PersistenceManager} from './core/persist/persistence-manager';
import {DocumentDatastore} from './core/datastore/document-datastore';
import {Validator} from './core/model/validator';
import {MatrixModule} from './components/matrix/matrix.module';


const remote = require('electron').remote;

let pconf: any = undefined;

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
        DatastoreModule,
        MatrixModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        ProjectsComponent
    ],
    providers: [
        ConfigReader,
        ConfigLoader,
        IdaiFieldAppConfigurator,
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [SettingsService],
            useFactory: (settingsService: SettingsService) =>
                 () => settingsService.bootProject().then(proconf => pconf = proconf)
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
        {
            provide: ProjectConfiguration,
            useFactory: () => {
                if (!pconf) {
                    console.error('pconf has not yet been provided');
                    throw 'pconf has not yet been provided';
                }
                return pconf;
            },
            deps: []
        },
        PersistenceManager,
        DocumentEditChangeMonitor,
        {
            provide: Validator,
            useFactory: function(projectConfiguration: ProjectConfiguration, datastore: IdaiFieldDocumentDatastore) {
                return new IdaiFieldValidator(projectConfiguration, datastore);
            },
            deps: [ProjectConfiguration, DocumentDatastore]
        },
        { provide: MD, useClass: M},
        DoceditActiveTabService,
        ImageTypeUtility
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }