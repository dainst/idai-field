import { Component, Input, OnChanges } from '@angular/core';
import { Field, FieldsViewField, Resource, Labels, InvalidDataUtil } from 'idai-field-core';


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
    public fieldDataLabel: string;


    constructor(private labels: Labels) {}


    async ngOnChanges() {

        this.fieldDataLabel = InvalidDataUtil.generateLabel(this.resource[this.field.name], this.labels);
    }


    public delete() {

        delete this.resource[this.field.name];
    }
}
