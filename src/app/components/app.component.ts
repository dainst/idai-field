import {Component, OnInit, Inject} from 'angular2/core';
import {RouteConfig,RouterLink,RouterOutlet} from 'angular2/router';
import {View} from "angular2/core";
import {OverviewComponent} from './overview.component';
import {Datastore} from "../services/datastore";
import {OBJECTS} from "../services/sample-objects";
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {MyObserver} from "../my-observer";

@Component({
    selector: 'idai-field-app',
    templateUrl: 'templates/app.html',
    directives: [RouterOutlet,RouterLink]
})
@RouteConfig([
    { path: "/", name: "Overview", component: OverviewComponent, useAsDefault: true}
])
export class AppComponent implements OnInit, MyObserver {

    private connectionCheckTimer: number;

    constructor(private datastore: Datastore,
            private idaiFieldBackend: IdaiFieldBackend,
            @Inject('app.config') private config) {
        this.idaiFieldBackend.subscribe(this);
    }

    ngOnInit() {
        this.idaiFieldBackend.setHostName(this.config.hostName);
        this.idaiFieldBackend.setIndexName(this.config.indexName);
        this.checkBackendConnection();
        if (this.config.environment == 'test') this.loadSampleData();
    }

    loadSampleData(): void {

        this.datastore.all({}).then(objects => {
            var promises = [];
            for (var ob of objects) promises.push(this.datastore.delete(ob._id));
            return Promise.all(promises);
        }).then(() => {
            var promises = [];
            for (var ob of OBJECTS) promises.push(this.datastore.create(ob));
            Promise.all(promises).then(
                () => console.log("Successfully stored sample objects"))
            .catch(
                err => console.error("Problem when storing sample data", err)
            );
        });
    }

    notify(): any {

        clearTimeout(this.connectionCheckTimer);
        this.checkBackendConnection();
    }

    checkBackendConnection(): void {

        this.idaiFieldBackend.checkConnection()
            .then(
                result => {
                    var interval: number = this.idaiFieldBackend.isConnected() ?
                        this.config.connectionCheckInterval.online : this.config.connectionCheckInterval.offline;

                    this.connectionCheckTimer = setTimeout(this.checkBackendConnection.bind(this), interval);
                }
        );
    }

}