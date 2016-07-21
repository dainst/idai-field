/// <reference path="../typings/index.d.ts" />
/// <reference path="../config/config.d.ts" />

import {bootstrap} from '@angular/platform-browser-dynamic';
import {AppComponent} from './app.component';
import {HTTP_PROVIDERS} from '@angular/http';
import {provide, enableProdMode} from '@angular/core';
import {Datastore} from "idai-components-2/idai-components-2";
import {ReadDatastore} from "idai-components-2/idai-components-2";
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {IdaiFieldBackend} from "./sync/idai-field-backend";
import {Messages} from "idai-components-2/idai-components-2";
import {SyncMediator} from "./sync/sync-mediator";
import CONFIG = require("config/config.json!json");
import {Indexeddb} from "./datastore/indexeddb";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {ElectronMenu} from "./electron-menu";
import {M} from "./m";
import {MD} from "idai-components-2/idai-components-2";
import {ROUTER_PROVIDERS} from '@angular/router-deprecated';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {PersistenceManager} from 'idai-components-2/idai-components-2';
import {DocumentEditChangeMonitor} from 'idai-components-2/idai-components-2';
import {Validator} from './model/validator';
import {ObjectList} from './overview/object-list';
import {FileSystemReader} from './import/file-system-reader';
import {Importer} from "./import/importer";
import {NativeJsonlParser} from "./import/native-jsonl-parser";

if (CONFIG['environment'] == 'production') enableProdMode();
if (CONFIG['targetPlatform'] == 'desktop') {
    require('electron-connect').client.create();
}

bootstrap(AppComponent, [
    ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
    provide(LocationStrategy, { useClass: HashLocationStrategy }),
    provide(Indexeddb, {useClass: Indexeddb}),
    provide(Datastore, { useClass: IndexeddbDatastore }),
    provide(ReadDatastore, { useExisting: Datastore }),
    provide(IndexeddbDatastore, { useExisting: Datastore }),
    provide(IdaiFieldBackend, { useClass: IdaiFieldBackend }),
    provide(Messages, { useClass: Messages }),
    provide('app.config', { useValue: CONFIG }),
    provide(ConfigLoader, {useClass: ConfigLoader}),
    provide(ElectronMenu, {useClass: ElectronMenu}),
    provide(ObjectList, {useClass: ObjectList}),
    provide(PersistenceManager, {useClass: PersistenceManager}),
    provide(DocumentEditChangeMonitor, {useClass: DocumentEditChangeMonitor}),
    provide(Validator, {useClass: Validator}),
    provide(DocumentEditChangeMonitor, {useClass: DocumentEditChangeMonitor}),
    provide(SyncMediator, {useClass: SyncMediator}),
    provide(MD, {useClass: M}),
    provide(NativeJsonlParser, {useClass: NativeJsonlParser}),
    provide(Importer, {useClass: Importer})
]);
