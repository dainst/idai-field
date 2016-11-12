import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {IdaiComponents2Module, Datastore, ReadDatastore, Messages, ConfigLoader, MD, PersistenceManager,
    DocumentEditChangeMonitor} from 'idai-components-2/idai-components-2';
import {routing} from './app.routing';
import {appRoutingProviders} from './app.routing';
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {IdaiFieldBackend} from "./sync/idai-field-backend";
import {SyncMediator} from "./sync/sync-mediator";
import {Indexeddb} from "./datastore/indexeddb";
import {Validator} from './model/validator';
import {Importer} from "./import/importer";
import {NativeJsonlParser} from "./import/native-jsonl-parser";
import {IdigCsvParser} from './import/idig-csv-parser';
import {M} from './m';
import {AppComponent} from './app.component';
import {OverviewModule} from './overview/overview.module';
import {ImportComponent} from './import/import.component';
import {SynchronizationComponent} from './sync/synchronization.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Mediastore} from './datastore/mediastore'
import {FakeMediastore} from './datastore/fake-mediastore'
import {FileSystemMediastore} from './datastore/file-system-mediastore'
import {ImagesModule} from './images/images.module'
import {NavbarComponent} from './navbar.component'

import CONFIG = require("config/config.json!json");

@NgModule({
    imports: [
        ImagesModule,
        OverviewModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        NgbModule,
        IdaiComponents2Module,
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
            useFactory: function(): Mediastore {
                // running under node
                if (typeof process === 'object') {
                    return new FileSystemMediastore();
                // running in browser
                } else {
                    return new FakeMediastore();
                }
            }
        },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        Indexeddb,
        { provide: Datastore, useClass: IndexeddbDatastore },
        { provide: ReadDatastore, useExisting: Datastore },
        { provide: IndexeddbDatastore, useExisting: Datastore },
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