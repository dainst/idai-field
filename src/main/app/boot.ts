/// <reference path="../../../typings/browser/ambient/es6-shim/index.d.ts" />

import {bootstrap}    from 'angular2/platform/browser'
import {AppComponent} from './components/app.component'
import {ROUTER_PROVIDERS} from 'angular2/router';
import {HTTP_PROVIDERS} from 'angular2/http';
import {provide, enableProdMode} from 'angular2/core';
import {LocationStrategy, HashLocationStrategy} from 'angular2/router';
import {Datastore} from "./datastore/datastore";
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {IdaiFieldBackend} from "./services/idai-field-backend";
import {Messages} from "./services/messages";
import {ProjectConfiguration} from "./services/project-configuration";

import CONFIG = require("../config/config.json");
import {Indexeddb} from "./datastore/indexeddb";
import {ConfigLoader} from "./services/config-loader";
import {M} from "./services/m";

if (CONFIG.environment == 'production') enableProdMode();

bootstrap(AppComponent, [
    ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
    provide(LocationStrategy, { useClass: HashLocationStrategy }),
    provide(Datastore, { useClass: IndexeddbDatastore }),
    provide(IdaiFieldBackend, { useClass: IdaiFieldBackend }),
    provide(Messages, { useClass: Messages }),
    provide('app.config', { useValue: CONFIG }),
    provide(Indexeddb, {useClass: Indexeddb}),
    provide(ConfigLoader, {useClass: ConfigLoader}),
    provide(M, {useClass: M})
]);