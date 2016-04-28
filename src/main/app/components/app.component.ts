import {Component, OnInit, Inject} from 'angular2/core';
import {RouteConfig,RouterLink,RouterOutlet} from 'angular2/router';
import {OverviewComponent} from './overview.component';
import {SynchronizationComponent} from "./synchronization.component";
import {Datastore} from "../datastore/datastore";
import {OBJECTS} from "../datastore/sample-objects";
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {MessagesComponent} from "./messages.component";
import {ProjectConfiguration} from "../model/project-configuration";
import {ConfigLoader} from "../services/config-loader";

@Component({
    selector: 'idai-field-app',
    templateUrl: 'templates/app.html',
    directives: [RouterOutlet, RouterLink, SynchronizationComponent, MessagesComponent]
})
@RouteConfig([
    { path: "/", name: "Overview", component: OverviewComponent, useAsDefault: true}
])
export class AppComponent implements OnInit {


    public projectConfiguration: ProjectConfiguration;

    constructor(private datastore: Datastore,
                private idaiFieldBackend: IdaiFieldBackend,
                @Inject('app.config') private config,
                private configLoader:ConfigLoader) {
    }

    ngOnInit() {
        if (this.config.environment == 'test') this.loadSampleData();

        this.configLoader.getProjectConfiguration().then(pc=>{
           this.projectConfiguration=pc;
        });
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