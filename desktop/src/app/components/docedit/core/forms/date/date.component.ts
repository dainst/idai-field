import { Component, Input, OnChanges } from '@angular/core';
import { DateConfiguration, DateSpecification, Field } from 'idai-field-core';
import { AngularUtility } from '../../../../../angular/angular-utility';


@Component({
    selector: 'form-field-date',
    templateUrl: './date.html',
    standalone: false,
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
})
/**
 * @author Thomas Kleinke
 */
export class DateComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() field: Field;

    public rangeMode: boolean;

    public showRangeButton: boolean = false;

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


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'y') {
            this.showRangeButton = !this.showRangeButton;
            AngularUtility.blurActiveElement();
        }
    }


    public setRangeViaSelect(value: 'single'|'range') {

        this.setRange(value === 'range');
    }


    public toggleRange() {

        this.setRange(!this.rangeMode);
    }


    public getRangeButtonTooltip(): string {

        if (!this.isOptionalRange()) return undefined;

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
