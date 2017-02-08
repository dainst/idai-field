import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {HttpModule, Http} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {Datastore, ReadDatastore} from 'idai-components-2/datastore';
import {IdaiMessagesModule, Messages, MD} from 'idai-components-2/messages';
import {IdaiDocumentsModule, DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Validator} from 'idai-components-2/persist';
import {PersistenceManager} from 'idai-components-2/persist';
import {ConfigLoader} from 'idai-components-2/configuration';
import {routing} from './app.routing';
import {appRoutingProviders} from './app.routing';
import {PouchdbDatastore} from "./datastore/pouchdb-datastore";
import {IdaiFieldBackend} from "./sync/idai-field-backend";
import {SyncMediator} from "./sync/sync-mediator";
import {Importer} from "./import/importer";
import {NativeJsonlParser} from "./import/native-jsonl-parser";
import {IdigCsvParser} from './import/idig-csv-parser';
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

const app = (<any>window).require('electron').remote.app;


var validate = function(path) {
    let newpath = path ? path : 'mediastore';
    newpath = app.getAppPath() + '/' + newpath;
    return (newpath.split('/').pop()) ? newpath + '/' : newpath;
};

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

                // running under node
                if (typeof process === 'object') {
                    return new FileSystemMediastore(validate(CONFIG['mediastorepath']));
                // running in browser
                } else {
                    return new HttpMediastore(http, validate(CONFIG['mediastorepath']));
                }
            },
            deps: [Http]
        },
        { provide: ReadMediastore, useExisting: Mediastore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: Datastore, useClass: PouchdbDatastore },
        { provide: ReadDatastore, useExisting: Datastore },
        IdaiFieldBackend,
        Messages,
        { provide: 'app.config', useValue: CONFIG },
        ConfigLoader,
        PersistenceManager,
        DocumentEditChangeMonitor,
        Validator,
        SyncMediator,
        { provide: MD, useClass: M},
        NativeJsonlParser,
        IdigCsvParser,
        Importer,
        appRoutingProviders
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }