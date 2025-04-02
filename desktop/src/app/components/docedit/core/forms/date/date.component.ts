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

    public rangeMode: boolean;


    constructor() {}


    public getFieldData = (): DateSpecification => this.fieldContainer[this.field.name];

    public getValue = () => this.getFieldData()?.value;

    public getEndValue = () => this.getFieldData()?.endValue;

    public updateValue = (value: string) => this.update(value, 'value');

    public isOptionalRange = () => this.field.dateConfiguration?.inputMode === DateConfiguration.InputMode.OPTIONAL;

    public isSwitchToRangeButtonVisible = () => this.isOptionalRange() && !this.rangeMode;


    ngOnChanges() {

        this.rangeMode = this.field.dateConfiguration?.inputMode === DateConfiguration.InputMode.RANGE
            || this.fieldContainer[this.field.name]?.isRange;
    }


    public switchToRange() {

        this.rangeMode = true;

        const fieldData: DateSpecification = this.getFieldData();
        if (fieldData) fieldData.isRange = true;
    }


    public switchToSingle() {

        this.rangeMode = false;
        
        const fieldData: DateSpecification = this.getFieldData();
        if (fieldData) fieldData.isRange = false;
    }


    public updateEndValue(value: string) {
        
        this.update(value, 'endValue');

        if (this.isOptionalRange() && !value) {
            this.switchToSingle();
        }
    }


    private update(value: string, propertyName: 'value'|'endValue') {

        if (value) {
            if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = { isRange: this.rangeMode };
            this.fieldContainer[this.field.name][propertyName] = value;
        } else if (this.fieldContainer[this.field.name]) {
            delete this.fieldContainer[this.field.name][propertyName];
            if (!this.fieldContainer[this.field.name].value && !this.fieldContainer[this.field.name].endValue) {
                delete this.fieldContainer[this.field.name];
            }
        }
    }
}
