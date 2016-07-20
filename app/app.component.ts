import {Component, OnInit, Inject} from '@angular/core';
import {OverviewComponent} from './overview/overview.component';
import {SynchronizationComponent} from "./sync/synchronization.component";
import {ImportComponent} from "./import/import.component";
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {DOCS} from "./datastore/sample-objects";
import {MessagesComponent} from "idai-components-2/idai-components-2";
import {RouteConfig, ROUTER_DIRECTIVES} from '@angular/router-deprecated';
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {ElectronMenu} from './electron-menu';

@Component({
    selector: 'idai-field-app',
    templateUrl: 'templates/app.html',
    directives: [ ROUTER_DIRECTIVES, SynchronizationComponent, MessagesComponent]
})
@RouteConfig([
    { path: "/", name: "Overview", component: OverviewComponent, useAsDefault: true },
    { path: "/import", name: "Import", component: ImportComponent }
])
export class AppComponent implements OnInit {

    public static PROJECT_CONFIGURATION_PATH = 'config/Configuration.json';
    public static RELATIONS_CONFIGURATION_PATH = 'config/Relations.json';

    constructor(private datastore: IndexeddbDatastore,
                @Inject('app.config') private config,
                private configLoader: ConfigLoader,
                private menu:ElectronMenu) {
        
        if (this.config.targetPlatform == "desktop") {
            menu.build();
        }
    }

    ngOnInit() {

        this.setConfigs();

        if (this.config.environment == 'test') this.loadSampleData();
    }

    private setConfigs() {

        this.configLoader.setProjectConfiguration(AppComponent.PROJECT_CONFIGURATION_PATH);
        this.configLoader.setRelationsConfiguration(AppComponent.RELATIONS_CONFIGURATION_PATH);
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
    }
}