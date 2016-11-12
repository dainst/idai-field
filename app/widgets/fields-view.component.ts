import {Component, OnInit, OnChanges, Input, EventEmitter, Output} from "@angular/core";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ProjectConfiguration, ConfigLoader, ReadDatastore} from "idai-components-2/idai-components-2";


@Component({
    selector: 'fields-view',
    moduleId: module.id,
    templateUrl: './fields-view.html'
})

/**
 * Shows fields of a document.
 *
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class FieldsViewComponent implements OnInit, OnChanges {

    protected fields: Array<any>;

    protected projectConfiguration: ProjectConfiguration;

    @Input() doc;

    constructor(
        private datastore: ReadDatastore,
        private configLoader: ConfigLoader
    ) {
        this.configLoader.configuration().subscribe((result) => {
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
            }
        });
    }

    private init() {
        this.fields = [];
        if (!this.doc) return;
        this.initializeFields(this.doc.resource);
    }

    ngOnInit() {
        this.init();
    }

    ngOnChanges() {
        this.init();
    }

    protected initializeFields(resource: IdaiFieldResource) {

        const ignoredFields: Array<string> = [ "id", "identifier", "shortDescription", "type", "relations", "geometries" ];

        for (var fieldName in resource) {
            if (resource.hasOwnProperty(fieldName) && ignoredFields.indexOf(fieldName) == -1) {
                this.fields.push({
                    name: this.getFieldLabel(resource.type, fieldName),
                    value: resource[fieldName],
                    isArray: Array.isArray(resource[fieldName])
                });
            }
        }
    }

    private getFieldLabel(type: string, fieldName: string) {

        var fields = this.projectConfiguration.getFields(type);
        return this.getLabel(fieldName, fields);
    }

    private getLabel(fieldName: string, fields: Array<any>) {

        for (var i in fields) {
            if (fields[i].name == fieldName) {
                if (fields[i].label) {
                    return fields[i].label;
                } else {
                    return fieldName;
                }
            }
        }

        return fieldName;
    }
}