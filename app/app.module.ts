import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {IdaiComponents2Module, Datastore, ReadDatastore, Messages, ConfigLoader, MD, PersistenceManager,
    DocumentEditChangeMonitor} from 'idai-components-2/idai-components-2';
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
import {SynchronizationComponent} from './sync/synchronization.component';
import {MapComponent} from './overview/map.component';
import {DocumentViewComponent} from './overview/document-view.component';
import {Ng2Bs3ModalModule} from 'ng2-bs3-modal/ng2-bs3-modal';

import CONFIG = require("config/config.json!json");

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        IdaiComponents2Module,
        Ng2Bs3ModalModule,
        routing
    ],
    declarations: [
        AppComponent,
        OverviewComponent,
        ImportComponent,
        SynchronizationComponent,
        MapComponent,
        DocumentViewComponent
    ],
    providers: [
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