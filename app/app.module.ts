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
import {SynchronizationComponent} from './sync/synchronization.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Mediastore} from 'idai-components-2/datastore';
import {ReadMediastore} from 'idai-components-2/datastore';
import {HttpImagestore} from './datastore/http-imagestore';
import {FileSystemImagestore} from './datastore/file-system-imagestore';
import {ImagesModule} from './images/images.module';
import {NavbarComponent} from './navbar.component';

import CONFIG = require("config/config.json!json");
import {CachedDatastore} from "./datastore/cached-datastore";

@NgModule({
    imports: [
        ImagesModule,
        ResourcesModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        NgbModule.forRoot(),
        IdaiDocumentsModule,
        IdaiMessagesModule,
        routing
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        ImportComponent,
        SynchronizationComponent
    ],
    providers: [
        {
            provide: Mediastore,
            useFactory: function(http: Http): Mediastore {

                // running under node / electron
                if (typeof process === 'object') {
                    let path;
                    if (CONFIG['imagestorepath']) {
                        path = CONFIG['imagestorepath'];
                    } else {
                        const app = (<any>window).require('electron').remote.app;
                        path = app.getPath('appData') + '/' + app.getName() + '/imagestore/';
                    }
                    return new FileSystemImagestore(path, CONFIG['environment'] == 'test');
                // running in browser
                } else {
                    let path = CONFIG['imagestorepath'] ? CONFIG['imagestorepath'] : 'imagestore';
                    return new HttpImagestore(http, path);
                }
            },
            deps: [Http]
        },
        { provide: ReadMediastore, useExisting: Mediastore },
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
                return new CachedDatastore(datastore);
            },
            deps: [ConfigLoader]
        },
        { provide: ReadDatastore, useExisting: Datastore },
        IdaiFieldBackend,
        Messages,
        { provide: 'app.config', useValue: CONFIG },
        ConfigLoader,
        PersistenceManager,
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
        appRoutingProviders
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }