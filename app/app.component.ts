import {Component, OnInit, Inject} from '@angular/core';
import {Router, Event, NavigationStart} from '@angular/router';
import {IndexeddbDatastore} from "./datastore/indexeddb-datastore";
import {DOCS} from "./datastore/sample-objects";
import {Messages} from "idai-components-2/messages";
import {ConfigLoader, ConfigurationValidator} from "idai-components-2/configuration";

@Component({
    moduleId: module.id,
    selector: 'idai-field-app',
    templateUrl: './app.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppComponent implements OnInit {

    public static PROJECT_CONFIGURATION_PATH = 'config/Configuration.json';

    private mandatoryFields = [{
        name : "identifier",
        description : "use this to uniquely identify your object",
        label : "Identifier",
        index: 0
    },{
        name : "shortDescription",
        label : "Kurzbeschreibung",
        index: 1
    }];

    private mandatoryTypes = ["image"];

    constructor(private datastore: IndexeddbDatastore,
                @Inject('app.config') private config,
                private configLoader: ConfigLoader,
                private router: Router,
                private messages: Messages) {

        // To get rid of stale messages when changing routes.
        // Note that if you want show a message to the user
        // on changing route, you have to write something
        // like
        // { router.navigate(['target']); messages.add('some'); }
        //
        router.events.subscribe( (event:Event) => {
            if(event instanceof NavigationStart) {
                this.messages.clear();
            }
        });
    }

    ngOnInit() {

        this.setConfig();
        if (this.config.environment == 'test') this.loadSampleData();
    }

    private setConfig() {
        this.configLoader.setConfigurationPath(AppComponent.PROJECT_CONFIGURATION_PATH);
        this.configLoader.configuration().subscribe(result => {
            if (result.error) {
                this.messages.addWithParams([result.error.msgkey].concat([result.error.msgparams]));
            } else {
                new ConfigurationValidator(this.mandatoryFields, this.mandatoryTypes)
                    .validate(result.projectConfiguration)
                    .errors.forEach(error => {
                    this.messages.add(error);
                });
            }
        });
    }


    loadSampleData(): void {

        this.datastore.clear()
        .then(() => {
            var promises = [];
            for (var ob of DOCS) promises.push(this.datastore.update(ob));
            Promise.all(promises)
                .then(() => console.log("Successfully stored sample objects"))
                .catch(err => console.error("Problem when storing sample data", err));
        });
    }
}