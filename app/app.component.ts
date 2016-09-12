import {Component, OnInit, Inject} from '@angular/core';
import {Router, Event, NavigationStart} from '@angular/router';
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {DOCS} from "./datastore/sample-objects";
import {Messages} from "idai-components-2/idai-components-2";
import {ConfigLoader} from "idai-components-2/idai-components-2";

@Component({
    selector: 'idai-field-app',
    templateUrl: 'templates/app.html'
})
export class AppComponent implements OnInit {

    public static PROJECT_CONFIGURATION_PATH = 'config/Configuration.json';
    public static RELATIONS_CONFIGURATION_PATH = 'config/Relations.json';

    constructor(private datastore: IndexeddbDatastore,
                @Inject('app.config') private config,
                private configLoader: ConfigLoader,
                private router: Router,
                private messages: Messages) {

        router.events.subscribe( (event:Event) => {
            if(event instanceof NavigationStart) {
                this.messages.clear();
            }
        });
    }

    ngOnInit() {

        this.setConfigs();

        if (this.config.environment == 'test') this.loadSampleData();
    }

    private setConfigs() {
        this.configLoader.setConfigurationPaths(AppComponent.PROJECT_CONFIGURATION_PATH, AppComponent.RELATIONS_CONFIGURATION_PATH);
        this.configLoader.configuration().subscribe(
            result=>{
                if (result.error)
                    this.messages.add(result.error.msgkey,[result.error.msgparams]);
            }
        )
    }

    loadSampleData(): void {

        this.datastore.clear()
        .then(() => {
            var promises = [];
            for (var ob of DOCS) promises.push(this.datastore.update(ob));
            Promise.all(promises).then(
                () => {
                    console.log("Successfully stored sample objects")
                })
            .catch(
                err => console.error("Problem when storing sample data", err)
            );
        });
    }
}