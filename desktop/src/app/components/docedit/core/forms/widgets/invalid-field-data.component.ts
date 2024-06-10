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
    public ready: boolean = false;


    constructor(private labels: Labels) {}


    async ngOnChanges() {

        this.fieldDataLabel = InvalidDataUtil.generateLabel(this.resource[this.field.name], this.labels);
        this.ready = true;
    }


    public delete() {

        delete this.resource[this.field.name];
    }
}
