import {Component, OnInit, Inject} from '@angular/core';
import {OverviewComponent} from './overview.component';
import {SynchronizationComponent} from "./synchronization.component";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";
import {DOCS} from "../datastore/sample-objects";
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {MessagesComponent} from "idai-components-2/idai-components-2";
import {RouteConfig, ROUTER_DIRECTIVES} from '@angular/router-deprecated';
import {ElectronMenu} from '../services/electron-menu';

@Component({
    selector: 'idai-field-app',
    templateUrl: 'templates/app.html',
    directives: [ ROUTER_DIRECTIVES, SynchronizationComponent, MessagesComponent]
})
@RouteConfig([
    { path: "/", name: "Overview", component: OverviewComponent, useAsDefault: true }
])
export class AppComponent implements OnInit {

    public static PROJECT_CONFIGURATION_PATH = 'config/Configuration.json';
    public static RELATIONS_CONFIGURATION_PATH = 'config/Relations.json';

    constructor(private datastore: IndexeddbDatastore,
                private idaiFieldBackend: IdaiFieldBackend,
                @Inject('app.config') private config,
                private menu:ElectronMenu) {
        
        if (this.config.targetPlatform == "desktop") {
            menu.build();
        }
    }

    ngOnInit() {
        if (this.config.environment == 'test') this.loadSampleData();
    }

    loadSampleData(): void {

        this.datastore.clear()
        .then(() => {
            var promises = [];
            for (var ob of DOCS) promises.push(this.datastore.create(ob));
            Promise.all(promises).then(
                () => console.log("Successfully stored sample objects"))
            .catch(
                err => console.error("Problem when storing sample data", err)
            );
        });
        this.idaiFieldBackend.resetIndex().then(
            () => console.log("Successfully cleared backend repository"))
        .catch(
            err => console.error("Could not clear backend repository")
        );
    }
}