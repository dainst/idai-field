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

    private hiddenEndValue: string;


    constructor() {}


    public getFieldData = (): DateSpecification => this.fieldContainer[this.field.name];

    public getValue = () => this.getFieldData()?.value;

    public getEndValue = () => this.getFieldData()?.endValue;

    public updateValue = (value: string) => this.update(value, 'value');

    public updateEndValue = (value: string) => this.update(value, 'endValue');

    public isRangeSupported = () => this.field.dateConfiguration.inputMode !== DateConfiguration.InputMode.SINGLE
        || this.getEndValue() !== undefined;    // Allow deleting unallowed end values

    public isOptionalRange = () => this.field.dateConfiguration.inputMode === DateConfiguration.InputMode.OPTIONAL
        || (this.field.dateConfiguration.inputMode === DateConfiguration.InputMode.SINGLE
            && this.getEndValue() !== undefined);   // Allow deleting unallowed end values


    ngOnChanges() {

        this.rangeMode = this.field.dateConfiguration.inputMode === DateConfiguration.InputMode.RANGE
            || this.fieldContainer[this.field.name]?.isRange;
    }


    public selectRange(value: 'single'|'range') {

        this.setRange(value === 'range');
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
        
        if (propertyName === 'endValue') this.cleanUpAfterUpdate(value);
    }


    private setRange(value: boolean) {

        this.rangeMode = value;

        const fieldData: DateSpecification = this.getFieldData();
        
        if (fieldData) {
            fieldData.isRange = this.rangeMode;

            if (!this.rangeMode) {
                this.hiddenEndValue = fieldData.endValue
                delete fieldData.endValue;
                if (!fieldData.value) delete this.fieldContainer[this.field.name];
            }
        }

        if (this.rangeMode && this.hiddenEndValue) {
            if (!fieldData) this.fieldContainer[this.field.name] = { isRange: true };
            this.fieldContainer[this.field.name].endValue = this.hiddenEndValue;
            this.hiddenEndValue = undefined;
        }
    }


    /** 
     * Clean up after adding or removing an end value in order to fix a date that didn't correspond to the
     * configured input mode
     */
    private cleanUpAfterUpdate(endValue: string) {

        if (!endValue && this.field.dateConfiguration.inputMode === DateConfiguration.InputMode.SINGLE) {
            this.fieldContainer[this.field.name].isRange = false;
            this.rangeMode = false;
        } else if (endValue && this.field.dateConfiguration.inputMode === DateConfiguration.InputMode.RANGE) {
            this.fieldContainer[this.field.name].isRange = true;
        }
    }
}
