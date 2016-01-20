import {bootstrap}    from 'angular2/platform/browser'
import {AppComponent} from './components/app.component'
import {ROUTER_PROVIDERS} from 'angular2/router';
import {HTTP_PROVIDERS} from 'angular2/http';
import {provide} from 'angular2/core';
import {LocationStrategy, HashLocationStrategy} from 'angular2/router';
import {Datastore} from "./services/datastore";
import {IndexeddbDatastore} from "./services/indexeddb-datastore";
import {Elasticsearch} from "./services/elasticsearch";

const config = {
	serverUri: 'http://127.0.0.1:9200'
}

bootstrap(AppComponent, [
	ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
	provide(LocationStrategy, { useClass: HashLocationStrategy }),
	provide(Datastore, { useClass: IndexeddbDatastore }),
	provide(Elasticsearch, { useClass: Elasticsearch }),
	provide('app.config', { useValue: config })
]);