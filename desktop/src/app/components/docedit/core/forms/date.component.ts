import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { NgbDateStruct, NgbInputDatepicker, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { toZonedTime } from 'date-fns-tz';
import { isString } from 'tsfun';
import { DateConfiguration, Field, formatDate, parseDate } from 'idai-field-core';
import { AngularUtility } from '../../../../angular/angular-utility';


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

    @ViewChild('dateInput', { static: false }) dateInputElement: ElementRef;

    public dateStruct: NgbDateStruct;
    public timeStruct: NgbTimeStruct;

    public onScrollListener: any;
    public scrollListenerInitialized: boolean = false;    
    public selectedTimezone: string;


    constructor(private changeDetectorRef: ChangeDetectorRef) {}


    public getFieldData = () => this.fieldContainer[this.field.name];

    public isDatePickerVisible = () => this.getFieldData() === undefined;

    public isTimePickerVisible = () => this.getFieldData()?.split('.').length > 2
        && this.field.dateConfiguration?.dataType !== DateConfiguration.DataType.DATE;

    public getTimezoneLabel = (timezone: string) => timezone;


    ngOnChanges() {
        
        this.setSystemTimezone();
        this.updateTimeStruct();
        this.updateDateStruct();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Enter') this.update();
    }


    public update() {

        const fieldValue: string|undefined = this.buildFieldValue();

        if (fieldValue) {
            this.fieldContainer[this.field.name] = fieldValue;
        } else {
            delete this.fieldContainer[this.field.name];
        }
    }


    public selectTimezone(timezone: string) {

        this.selectedTimezone = timezone;
        this.update();
    }


    public async removeFieldData() {

        delete this.fieldContainer[this.field.name];
        this.dateStruct = {} as NgbDateStruct;
        await this.focusInputField();
    }


    public async focusInputField() {

        await AngularUtility.refresh();

        if (this.dateInputElement) {
            this.dateInputElement.nativeElement.focus();
        };
    }


    public listenToScrollEvents(datePicker: NgbInputDatepicker) {

        this.scrollListenerInitialized = false;

        this.onScrollListener = this.onScroll(datePicker).bind(this);
        window.addEventListener('scroll', this.onScrollListener, true);
    }

    
    public stopListeningToScrollEvents() {

        if (!this.onScrollListener) return;

        window.removeEventListener('scroll', this.onScrollListener, true);
        this.onScrollListener = undefined;
    }


    public getFormattedDate(): string|undefined {

        if (!this.dateStruct) return undefined;

        if (isString(this.dateStruct)) {
            return this.dateStruct;
        } else {
            let stringDate = '';
            stringDate += DateComponent.isNumber(this.dateStruct.day)
                ? DateComponent.padNumber(this.dateStruct.day) + '.'
                : '';
            stringDate += DateComponent.isNumber(this.dateStruct.month)
                ? DateComponent.padNumber(this.dateStruct.month) + '.'
                : '';
            return stringDate + this.dateStruct.year;
        }
    }


    public getAvailableTimezones(): string[] {

        return Intl.supportedValuesOf('timeZone');
    }


    private setSystemTimezone() {

        this.selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }


    private updateDateStruct() {

        const date: string = this.getFieldData();
        if (!date) return;

        const parsedDate: Date = toZonedTime(
            parseDate(date),
            this.selectedTimezone
        );

        const dateSegmentsCount: number = date.split('.').length;

        this.dateStruct = {
            year: parsedDate.getFullYear(),
            month: dateSegmentsCount > 1 ? parsedDate.getMonth() + 1 : undefined,
            day: dateSegmentsCount > 2 ? parsedDate.getDate() : undefined
        };
    }


    private updateTimeStruct() {

        const date: string = this.getFieldData();
        if (!date || !date.includes(':')) return;

        const parsedDate: Date = toZonedTime(
            parseDate(date),
            this.selectedTimezone
        );

        this.timeStruct = { hour: parsedDate.getHours(), minute: parsedDate.getMinutes(), second: 0 };
    }


    private buildFieldValue(): string|undefined {

        let formattedDate: string = this.getFormattedDate();
        if (!formattedDate) return undefined;

        if (this.isTimeSelected()) formattedDate += ' ' + this.getFormattedTime();

        if (isNaN(parseDate(formattedDate)?.getTime())) return undefined;

        return this.isTimeSelected()
            ? this.applySelectedTimezone(formattedDate)
            : formattedDate;
    }


    private getFormattedTime(): string|undefined {

        return DateComponent.padNumber(this.timeStruct.hour) + ':'
            + DateComponent.padNumber(this.timeStruct.minute);
    }


    private isTimeSelected(): boolean {

        return DateComponent.isNumber(this.timeStruct?.hour)
            && DateComponent.isNumber(this.timeStruct?.minute);
    }


    private applySelectedTimezone(formattedDate: string): string {

        const date: Date = parseDate(formattedDate, this.selectedTimezone);
        console.log('date:', date);
        return formatDate(date);
    }


    private onScroll = (datePicker: NgbInputDatepicker) => (event: MouseEvent) => {

        if (!this.scrollListenerInitialized) {
            this.scrollListenerInitialized = true;
            return;
        }

        datePicker.close();
        this.changeDetectorRef.detectChanges();
    }


    private static padNumber(value: number) {

	    return (this.isNumber(value)) ? `0${value}`.slice(-2) : '';
	}


	private static isNumber(value: any): boolean {

	    return !isNaN(this.toInteger(value));
	}


    private static toInteger(value: any): number {

	    return parseInt(`${value}`, 10);
	}
}
