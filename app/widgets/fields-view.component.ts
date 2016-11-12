import {Component, OnInit, OnChanges, Input, EventEmitter, Output} from "@angular/core";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ProjectConfiguration, ConfigLoader, ReadDatastore} from "idai-components-2/idai-components-2";
import {WithConfiguration} from '../util/with-configuration';

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
export class FieldsViewComponent extends WithConfiguration implements OnInit, OnChanges {

    protected fields: Array<any>;



    @Input() doc;

    constructor(
        private datastore: ReadDatastore,
        configLoader: ConfigLoader
    ) {
        super(configLoader);
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
}