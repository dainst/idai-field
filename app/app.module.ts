import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {HttpModule, Http} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {Datastore, ReadDatastore} from 'idai-components-2/datastore';
import {IdaiMessagesModule, Messages, MD} from 'idai-components-2/messages';
import {IdaiDocumentsModule, DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Validator} from 'idai-components-2/persist';
import {IdaiFieldValidator} from './model/idai-field-validator';
import {PersistenceManager} from 'idai-components-2/persist';
import {ConfigLoader} from 'idai-components-2/configuration';
import {routing} from './app.routing';
import {appRoutingProviders} from './app.routing';
import {IdaiFieldDatastore} from "./datastore/idai-field-datastore";
import {PouchdbDatastore} from "./datastore/pouchdb-datastore";
import {PouchdbServerDatastore} from "./datastore/pouchdb-server-datastore";
import {IdaiFieldBackend} from "./sync/idai-field-backend";
import {SyncMediator} from "./sync/sync-mediator";
import {Importer} from "./import/importer";
import {M} from './m';
import {AppComponent} from './app.component';
import {ResourcesModule} from './resources/resources.module';
import {ImportComponent} from './import/import.component';
import {RelationsCompleter} from './import/relations-completer';
import {SynchronizationComponent} from './sync/synchronization.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Imagestore} from './imagestore/imagestore';
import {ReadImagestore} from './imagestore/read-imagestore';
import {FileSystemImagestore} from './imagestore/file-system-imagestore';
import {ImagesModule} from './images/images.module';
import {NavbarComponent} from './navbar.component';
import {ListModule} from './list/list.module';

import CONFIG = require("config/config.json!json");
import {CachedDatastore} from "./datastore/cached-datastore";
import {BlobMaker} from "./imagestore/blob-maker";
import {Converter} from "./imagestore/converter";

import {IdaiWidgetsModule} from "idai-components-2/widgets"
import {SettingsModule} from "./settings/settings.module";
import {AppConfigurator} from "./app-configurator";
import {SettingsService} from "./settings/settings-service";

@NgModule({
    imports: [
        ImagesModule,
        ResourcesModule,
        ListModule,
        SettingsModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        NgbModule.forRoot(),
        IdaiDocumentsModule,
        IdaiMessagesModule,
        routing,
        IdaiWidgetsModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        ImportComponent,
        SynchronizationComponent
    ],
    providers: [
        SettingsService,
        {
            provide: Imagestore,
            useFactory: function(http: Http,blobMaker: BlobMaker): Imagestore {

                let path;
                if (CONFIG['imagestorepath']) {
                    path = CONFIG['imagestorepath'];
                } else {
                    const app = (<any>window).require('electron').remote.app;
                    path = app.getPath('appData') + '/' + app.getName() + '/imagestore/';
                }
                return new FileSystemImagestore(new Converter(), blobMaker, path, CONFIG['environment'] == 'test');

            },
            deps: [Http, BlobMaker]
        },
        { provide: ReadImagestore, useExisting: Imagestore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        {
            provide: Datastore,
            useFactory: function(configLoader: ConfigLoader) : Datastore {
                let test = CONFIG['environment'] == 'test';
                let dbname = CONFIG['database'] ? CONFIG['database'] : 'idai-field-documents';
                let datastore;
                // running under node / electron
                if (typeof process === 'object') {
                    datastore = new PouchdbServerDatastore(dbname, configLoader, test);
                // running in browser
                } else {
                    datastore = new PouchdbDatastore(dbname, configLoader, test);
                }
                // setup sync
                if(CONFIG['sync']) CONFIG['sync'].forEach(uri => datastore.setupSync(uri));
                return new CachedDatastore(datastore);
            },
            deps: [ConfigLoader]
        },
        { provide: ReadDatastore, useExisting: Datastore },
        { provide: IdaiFieldDatastore, useExisting: Datastore },
        IdaiFieldBackend,
        Messages,
        BlobMaker,
        { provide: 'app.config', useValue: CONFIG },
        ConfigLoader,
        PersistenceManager,
        AppConfigurator,
        DocumentEditChangeMonitor,
        {
            provide: Validator,
            useFactory: function(configLoader: ConfigLoader, datastore: IdaiFieldDatastore) {
                return new IdaiFieldValidator(configLoader, datastore);
            },
            deps: [ConfigLoader, ReadDatastore]
        },
        SyncMediator,
        { provide: MD, useClass: M},
        Importer,
        RelationsCompleter,
        appRoutingProviders
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }