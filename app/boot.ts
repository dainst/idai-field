/// <reference path="../typings/browser/ambient/es6-shim/index.d.ts" />
/// <reference path="../typings/browser/ambient/node/index.d.ts" />
/// <reference path="../typings/browser/ambient/github-electron/index.d.ts" />
/// <reference path="../config/config.d.ts" />

import {bootstrap}    from '@angular/platform-browser-dynamic'
import {AppComponent} from './components/app.component'
import {HTTP_PROVIDERS} from '@angular/http';
import {provide, enableProdMode} from '@angular/core';
import {Datastore} from "idai-components-2/idai-components-2";
import {ReadDatastore} from "idai-components-2/idai-components-2";
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {IdaiFieldBackend} from "./services/idai-field-backend";
import {Messages} from "idai-components-2/idai-components-2";
import {SyncMediator} from "./services/sync-mediator";
import CONFIG = require("config/config.json!json");
import {Indexeddb} from "./datastore/indexeddb";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {ElectronMenu} from "./services/electron-menu";
import {M} from "./m";
import {MD} from "idai-components-2/idai-components-2";
import {ROUTER_PROVIDERS} from '@angular/router-deprecated';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {PersistenceManager} from 'idai-components-2/idai-components-2';
import {LoadAndSaveService} from 'idai-components-2/idai-components-2';
import {ValidationInterceptor} from 'idai-components-2/idai-components-2';
import {AppValidationInterceptor} from './components/app-validation-interceptor';
import {Project} from './model/project';

if (CONFIG['environment'] == 'production') enableProdMode();

bootstrap(AppComponent, [
    ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
    provide(LocationStrategy, { useClass: HashLocationStrategy }),
    provide(Datastore, { useClass: IndexeddbDatastore }),
    provide(ReadDatastore, { useExisting: Datastore }),
    provide(IdaiFieldBackend, { useClass: IdaiFieldBackend }),
    provide(Messages, { useClass: Messages }),
    provide('app.config', { useValue: CONFIG }),
    provide(Indexeddb, {useClass: Indexeddb}),
    provide(ConfigLoader, {useClass: ConfigLoader}),
    provide(ElectronMenu, {useClass: ElectronMenu}),
    provide(Project, {useClass: Project}),
    provide(PersistenceManager, {useClass: PersistenceManager}),
    provide(LoadAndSaveService, {useClass: LoadAndSaveService}),
    provide(ValidationInterceptor, {useClass: AppValidationInterceptor}),
    provide(SyncMediator, {useClass: SyncMediator}),
    provide(MD, {useClass: M})
]);
