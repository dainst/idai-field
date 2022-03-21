import { Component, Input, OnChanges } from '@angular/core';
import { Map } from 'tsfun';
import { Field, FieldsViewField, FieldsViewUtil, ProjectConfiguration, Document, Resource,
    Datastore, Labels } from 'idai-field-core';


@Component({
    selector: 'invalid-field-data',
    templateUrl: './invalid-field-data.html'
})
/**
 * @author Thomas Kleinke
 */
export class InvalidFieldDataComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: Field;

    public fieldsViewField: FieldsViewField;


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private labels: Labels) {}


    async ngOnChanges() {

        const relationTargets: Map<Document[]> = await Resource.getRelationTargetDocuments(
            this.resource, this.datastore
        );

        this.fieldsViewField = FieldsViewUtil.makeField(
            this.projectConfiguration,
            relationTargets,
            this.labels
        )([this.field, this.resource[this.field.name]]);
    }


    public delete() {

        delete this.resource[this.field.name];
    }
}
