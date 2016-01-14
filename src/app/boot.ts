import {bootstrap}    from 'angular2/platform/browser'
import {AppComponent} from './components/app.component'
import {ROUTER_PROVIDERS} from 'angular2/router';
import {provide} from 'angular2/core';
import {LocationStrategy, HashLocationStrategy} from 'angular2/router';
import {Datastore} from "./services/datastore";
import {PouchdbDatastore} from "./services/pouchdb-datastore";

bootstrap(AppComponent, [
	ROUTER_PROVIDERS, 
	provide(LocationStrategy, { useClass: HashLocationStrategy }),
	provide(Datastore, {useClass: PouchdbDatastore})
]);