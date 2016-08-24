import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {HTTP_PROVIDERS} from '@angular/http';
import {Datastore, ReadDatastore, Messages, ConfigLoader, MD, PersistenceManager, DocumentEditChangeMonitor}
    from 'idai-components-2/idai-components-2';
import {routing} from './app.routing';
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {IdaiFieldBackend} from "./sync/idai-field-backend";
import {SyncMediator} from "./sync/sync-mediator";
import {Indexeddb} from "./datastore/indexeddb";
import {Validator} from './model/validator';
import {ObjectList} from './overview/object-list';
import {Importer} from "./import/importer";
import {NativeJsonlParser} from "./import/native-jsonl-parser";
import {IdigCsvParser} from './import/idig-csv-parser';
import {M} from './m';
import {AppComponent} from './app.component';
import {OverviewComponent} from './overview/overview.component';
import {ImportComponent} from './import/import.component';

import CONFIG = require("config/config.json!json");

@NgModule({
    imports: [
        BrowserModule,
        routing
    ],
    declarations: [
        AppComponent,
        OverviewComponent,
        ImportComponent
    ],
    providers: [
        HTTP_PROVIDERS,
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        Indexeddb,
        { provide: Datastore, useClass: IndexeddbDatastore },
        { provide: ReadDatastore, useExisting: Datastore },
        { provide: IndexeddbDatastore, useExisting: Datastore },
        IdaiFieldBackend,
        Messages,
        { provide: 'app.config', useValue: CONFIG },
        ConfigLoader,
        ObjectList,
        PersistenceManager,
        DocumentEditChangeMonitor,
        Validator,
        SyncMediator,
        { provide: MD, useClass: M},
        NativeJsonlParser,
        IdigCsvParser,
        Importer
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }