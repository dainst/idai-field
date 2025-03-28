import { Component, Input, OnChanges } from '@angular/core';
import { DateSpecification, Field } from 'idai-field-core';


@Component({
    selector: 'form-field-date',
    templateUrl: './date.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DateComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() field: Field;


    constructor() {}


    public getFieldData = (): DateSpecification => this.fieldContainer[this.field.name];

    public getValue = () => this.getFieldData()?.value;


    ngOnChanges() {
    }


    public updateValue(value: string) {

        if (value) {
            if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = {};
            this.fieldContainer[this.field.name].value = value;
        } else {
            delete this.fieldContainer[this.field.name];
        }
    }
}
