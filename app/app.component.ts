import {Component, OnInit, Inject} from "@angular/core";
import {Router, Event, NavigationStart} from "@angular/router";
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

    private defaultTypes = [{
        "type" : "image",
        "fields" : [
            {
                name : "height",
                editable : false,
                label: "Höhe"
            },
            {
                name : "width",
                editable : false,
                label: "Breite"
            },
            {
                name : "filename",
                editable : false,
                label: "Dateiname"
            }
        ]
    }];

    private defaultFields = [{
        name : "shortDescription",
        label : "Kurzbeschreibung",
        visible: false
    },{
        name : "identifier",
        description : "use this to uniquely identify your object",
        label : "Identifier",
        visible: false,
    },{
        name: "id",
        visible: false,
        editable: false
    },{
        name: "type",
        visible: false,
        editable: false
    }

    ];



    constructor(@Inject('app.config') private config,
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
    }

    private setConfig() {
        this.configLoader.load(
            AppComponent.PROJECT_CONFIGURATION_PATH,
            this.defaultTypes,
            this.defaultFields
        );
        this.configLoader.configuration().subscribe(result => {
            if (result.error) {
                this.messages.addWithParams([result.error.msgkey].concat([result.error.msgparams]));
            } else {
                new ConfigurationValidator([],[])
                    .validate(result.projectConfiguration)
                    .errors.forEach(error => {
                    this.messages.add(error);
                });
            }
        });
    }
}