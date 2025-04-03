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

    public updateEndValue = (value: string) => this.update(value, 'endValue');

    public isOptionalRange = () => this.field.dateConfiguration?.inputMode === DateConfiguration.InputMode.OPTIONAL;


    ngOnChanges() {

        this.rangeMode = this.field.dateConfiguration?.inputMode === DateConfiguration.InputMode.RANGE
            || this.fieldContainer[this.field.name]?.isRange;
    }


    public toggleRange() {

        this.rangeMode = !this.rangeMode;

        const fieldData: DateSpecification = this.getFieldData();
        if (fieldData) fieldData.isRange = this.rangeMode;
    }


    public getRangeButtonTooltip(): string {

        return this.rangeMode
            ? $localize `:@@docedit.forms.date.switchToSingle:Auf Einzeldatum umstellen`
            : $localize `:@@docedit.forms.date.switchToRange:Auf Datumsbereich umstellen`;
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
