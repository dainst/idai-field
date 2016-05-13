/// <reference path="../typings/browser/ambient/es6-shim/index.d.ts" />
/// <reference path="../typings/browser/ambient/node/index.d.ts" />
/// <reference path="../typings/browser/ambient/github-electron/index.d.ts" />
/// <reference path="../config/config.d.ts" />

import {bootstrap}    from '@angular/platform-browser-dynamic'
import {AppComponent} from './components/app.component'
import {HTTP_PROVIDERS} from '@angular/http';
import {provide, enableProdMode} from '@angular/core';
import {Datastore} from "./datastore/datastore";
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {IdaiFieldBackend} from "./services/idai-field-backend";
import {Messages} from "./services/messages";
import CONFIG = require("config/config.json!json");
import {Indexeddb} from "./datastore/indexeddb";
import {ConfigLoader} from "./services/config-loader";
import {ElectronMenu} from "./services/electron-menu";
import {M} from "./m";
import {ReadDatastore} from "./datastore/read-datastore";
import {ROUTER_PROVIDERS} from '@angular/router-deprecated';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';

if (CONFIG['environment'] == 'production') enableProdMode();

bootstrap(AppComponent, [
    ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
    provide(LocationStrategy, { useClass: HashLocationStrategy }),
    provide(Datastore, { useClass: IndexeddbDatastore }),
    provide(ReadDatastore, { useClass: IndexeddbDatastore }),
    provide(IdaiFieldBackend, { useClass: IdaiFieldBackend }),
    provide(Messages, { useClass: Messages }),
    provide('app.config', { useValue: CONFIG }),
    provide(Indexeddb, {useClass: Indexeddb}),
    provide(ConfigLoader, {useClass: ConfigLoader}),
    provide(ElectronMenu, {useClass: ElectronMenu}),
    provide(M, {useClass: M})
]);
