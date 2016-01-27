import {bootstrap}    from 'angular2/platform/browser'
import {AppComponent} from './components/app.component'
import {ROUTER_PROVIDERS} from 'angular2/router';
import {HTTP_PROVIDERS} from 'angular2/http';
import {provide, enableProdMode} from 'angular2/core';
import {LocationStrategy, HashLocationStrategy} from 'angular2/router';
import {Datastore} from "./services/datastore";
import {IndexeddbDatastore} from "./services/indexeddb-datastore";
import {IdaiFieldBackend} from "./services/idai-field-backend";

const config = {
	environment: 'development', // choose 'test', 'development' or 'production'
    hostName: 'http://127.0.0.1:9200',
    indexName: 'idaifield',
    backendConnectionCheckInterval: 1000
};

if (config.environment == 'production') enableProdMode();

bootstrap(AppComponent, [
	ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
	provide(LocationStrategy, { useClass: HashLocationStrategy }),
	provide(Datastore, { useClass: IndexeddbDatastore }),
	provide(IdaiFieldBackend, { useClass: IdaiFieldBackend }),
	provide('app.config', { useValue: config })
]);