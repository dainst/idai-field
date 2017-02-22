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
import {PouchdbDatastore} from "./datastore/pouchdb-datastore";
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
import {HttpMediastore} from './datastore/http-mediastore';
import {FileSystemMediastore} from './datastore/file-system-mediastore';
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
                    if (CONFIG['mediastorepath']) {
                        path = CONFIG['mediastorepath'];
                    } else {
                        const app = (<any>window).require('electron').remote.app;
                        path = app.getPath('appData') + '/' + app.getName() + '/mediastore/';
                    }
                    return new FileSystemMediastore(path, CONFIG['environment'] == 'test');
                // running in browser
                } else {
                    let path = CONFIG['mediastorepath'] ? CONFIG['mediastorepath'] : 'sample-images';
                    return new HttpMediastore(http, path);
                }
            },
            deps: [Http]
        },
        { provide: ReadMediastore, useExisting: Mediastore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        {
            provide: Datastore,
            useFactory: function() : Datastore {
                return new CachedDatastore(new PouchdbDatastore('idai-field-documents',CONFIG['environment'] == 'test'));
            }
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
            useFactory: function(configLoader:ConfigLoader,datastore:ReadDatastore) {
                return new IdaiFieldValidator(configLoader,datastore);
            },
            deps: [ConfigLoader,ReadDatastore]
        },
        SyncMediator,
        { provide: MD, useClass: M},
        Importer,
        appRoutingProviders
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }