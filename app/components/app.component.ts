import {Component, OnInit, Inject} from '@angular/core';
import {OverviewComponent} from './overview.component';
import {SynchronizationComponent} from "./synchronization.component";
import {Datastore} from "idai-components-2/idai-components-2";
import {OBJECTS} from "../datastore/sample-objects";
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {MessagesComponent} from "idai-components-2/idai-components-2";
import {ProjectConfiguration} from "idai-components-2/idai-components-2";
import {RelationsConfiguration} from "idai-components-2/idai-components-2";
import {ConfigLoader} from "idai-components-2/idai-components-2";
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

    public projectConfiguration: ProjectConfiguration;

    constructor(private datastore: Datastore,
                private idaiFieldBackend: IdaiFieldBackend,
                @Inject('app.config') private config,
                private configLoader:ConfigLoader,
                private menu:ElectronMenu) {
        if (this.config.targetPlatform == "desktop") {
            menu.build();
        }
    }

    ngOnInit() {
        if (this.config.environment == 'test') this.loadSampleData();
        this.configLoader.getProjectConfiguration(AppComponent.PROJECT_CONFIGURATION_PATH).then(configs=>{
            this.projectConfiguration=configs[0];
        }, (errs)=>{console.error('errs: ',errs)});
    }

    loadSampleData(): void {

        this.datastore.clear()
        .then(() => {
            var promises = [];
            for (var ob of OBJECTS) promises.push(this.datastore.create(ob));
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