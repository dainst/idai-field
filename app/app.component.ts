import {Component, OnInit, Inject} from '@angular/core';
import {Router, Event, NavigationStart} from '@angular/router';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader,
    ConfigurationPreprocessor,
    ConfigurationValidator} from 'idai-components-2/configuration';

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
        "type": "image",
        "fields": [
            {
                name: "height",
                editable: false,
                label: "Höhe"
            },
            {
                name: "width",
                editable: false,
                label: "Breite"
            },
            {
                name : "filename",
                editable: false,
                label: "Dateiname"
            },
            {
                name: "georeference",
                visible: false,
                editable: false,
            }
        ]
    }];

    private defaultFields = [{
        name: "shortDescription",
        label: "Kurzbeschreibung",
        visible: false
    }, {
        name: "identifier",
        description: "use this to uniquely identify your object",
        label: "Identifier",
        visible: false,
        mandatory: true
    }, {
        name: "geometry",
        visible: false,
        editable: false
    }];

    private defaultRelations = [
        {name: 'depicts', domain: ['image:inherit'], inverse: 'depictedIn', label: 'Zeigt', editable: true},
        {name: 'depictedIn', range: ['image:inherit'], inverse: 'depicts', visible: false, editable: false}
    ];


    constructor(@Inject('app.config') private config,
                private configLoader: ConfigLoader,
                private router: Router,
                private messages: Messages) {

        // To get rid of stale messages when changing routes.
        // Note that if you want show a message to the user
        // on changing route, you have to write something
        // like
        // { router.navigate(['target']); messages.add(['some']); }
        //
        router.events.subscribe( (event:Event) => {
            if(event instanceof NavigationStart) {
                this.messages.clear();
            }
        });

        this.preventDefaultDragAndDropBehavior();
    }

    ngOnInit() {
        this.setConfig();
    }

    private setConfig() {

        this.configLoader.go(
            AppComponent.PROJECT_CONFIGURATION_PATH,
            new ConfigurationPreprocessor(
                this.defaultTypes,
                this.defaultFields,
                this.defaultRelations)
            ,
            new ConfigurationValidator([])
        );
        this.configLoader.getProjectConfiguration().catch(msgWithParams => {
            this.messages.add(msgWithParams);
        });
    }

    private preventDefaultDragAndDropBehavior() {

        document.addEventListener('dragover', event => event.preventDefault());
        document.addEventListener('drop', event => event.preventDefault());
    }
}