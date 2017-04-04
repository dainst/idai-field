import {Injectable} from '@angular/core';
import {ConfigLoader,
    ConfigurationPreprocessor,
    ConfigurationValidator} from 'idai-components-2/configuration';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class AppConfigurator {

    constructor(private configLoader: ConfigLoader) { }

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

    public go(reset: boolean = false) {

        this.configLoader.go(
            AppConfigurator.PROJECT_CONFIGURATION_PATH,
            new ConfigurationPreprocessor(
                this.defaultTypes,
                this.defaultFields,
                this.defaultRelations)
            ,
            new ConfigurationValidator([])
        );
    }
}