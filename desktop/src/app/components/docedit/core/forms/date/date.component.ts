import { Component, Input, OnChanges } from '@angular/core';
import { DateConfiguration, DateSpecification, Field } from 'idai-field-core';


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

    public endValueVisible: boolean = false;


    constructor() {}


    public getFieldData = (): DateSpecification => this.fieldContainer[this.field.name];

    public getValue = () => this.getFieldData()?.value;

    public getEndValue = () => this.getFieldData()?.endValue;

    public updateValue = (value: string) => this.update(value, 'value');

    public isOptionalRange = () => this.field.dateConfiguration?.inputMode === DateConfiguration.InputMode.OPTIONAL;

    public isSwitchToRangeButtonVisible = () => this.isOptionalRange() && !this.endValueVisible;


    ngOnChanges() {

        this.endValueVisible = this.field.dateConfiguration?.inputMode === DateConfiguration.InputMode.RANGE
            || this.fieldContainer[this.field.name]?.endValue !== undefined;
    }


    public isSwitchToRangeButtonEnabled(): boolean {

        const value: string = this.getValue();
        if (!value) return false;
        
        return this.field.dateConfiguration?.dataType !== DateConfiguration.DataType.DATE_TIME || value.includes(':');
    }


    public switchToRange() {

        this.endValueVisible = true;
    }


    public switchToSingle() {

        this.endValueVisible = false;
    }


    public updateEndValue(value: string) {
        
        this.update(value, 'endValue');

        if (this.isOptionalRange() && !value) {
            this.endValueVisible = false;
        }
    }


    private update(value: string, propertyName: 'value'|'endValue') {

        if (value) {
            if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = {};
            this.fieldContainer[this.field.name][propertyName] = value;
        } else if (this.fieldContainer[this.field.name]) {
            delete this.fieldContainer[this.field.name][propertyName];
            if (!this.fieldContainer[this.field.name].value && !this.fieldContainer[this.field.name].endValue) {
                delete this.fieldContainer[this.field.name];
            }
        }
    }
}
