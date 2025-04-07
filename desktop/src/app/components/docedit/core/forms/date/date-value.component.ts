import { ChangeDetectorRef, Component, ElementRef, Input, Output, ViewChild, EventEmitter,
    OnInit } from '@angular/core';
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { toZonedTime } from 'date-fns-tz';
import { isString } from 'tsfun';
import { DateConfiguration, Field, formatDate, parseDate } from 'idai-field-core';
import { AngularUtility } from '../../../../../angular/angular-utility';
import { TimeSpecification } from './time-input.component';


@Component({
    selector: 'date-value',
    templateUrl: './date-value.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DateValueComponent implements OnInit {

    @Input() value: string;
    @Input() field: Field;

    @Output() onChanged: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('dateInput', { static: false }) dateInputElement: ElementRef;
    @ViewChild('datePicker', { static: false }) datePicker: any;

    public dateStruct: NgbDateStruct;
    public time: TimeSpecification;

    public editing: boolean = false;
    public selectedTimezone: string;

    public onScrollListener: any;
    public scrollListenerInitialized: boolean = false;

    private originalValue: string;
    private originalDateStruct: NgbDateStruct;


    constructor(private changeDetectorRef: ChangeDetectorRef) {}


    public isDatePickerVisible = () => this.value === undefined;

    public isTimePickerVisible = () => (this.isTimeSupported() || this.isTimeSelected())
        && (DateValueComponent.isFullDate(this.value) || this.editing);

    public isNowButtonVisible = () => this.isDatePickerVisible() && !this.isTimePickerVisible() && !this.editing;

    public getTimezoneLabel = (timezone: string) => timezone;


    ngOnInit() {

        this.setSystemTimezone();
        this.updateDateStruct();
        this.updateTime();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Enter') this.update();
    }


    public onTimeChanged(time: TimeSpecification) {

        this.time = time;
        this.update();
    }


    public async onDatePickerClosed() {

        this.stopListeningToScrollEvents();
        this.blurInputField();
        this.update();
    }


    public onDateInputBlurred() {

        if (!this.datePicker) this.update();
    }


    public async update() {

        this.value = this.buildValue();

        if (this.editing && !this.value) {
            this.value = this.originalValue;
            this.dateStruct = this.originalDateStruct;
        }

        this.originalValue = undefined;
        this.originalDateStruct = undefined;
        this.editing = false;

        this.onChanged.emit(this.value);
    }


    public selectTimezone(timezone: string) {

        this.selectedTimezone = timezone;
        this.update();
    }


    public async editDate() {

        this.editing = true;
        this.originalValue = this.value;
        this.originalDateStruct = this.dateStruct;
        this.value = undefined;
        this.dateStruct = {} as NgbDateStruct;

        await AngularUtility.refresh();

        this.toggleDatePicker();
    }


    public setCurrentDate() {

        this.value = formatDate(
            new Date(),
            undefined,
            'UTC',
            this.isTimeSupported() ? 'shortTime' : 'date'
        );

        this.updateDateStruct();
        this.updateTime();
        this.onChanged.emit(this.value);
    }


    public toggleDatePicker() {

        console.log('TOGGLE!');

        this.datePicker.toggle();
        this.focusInputField();
        this.listenToScrollEvents();
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
            stringDate += DateValueComponent.isNumber(this.dateStruct.day)
                ? DateValueComponent.padNumber(this.dateStruct.day) + '.'
                : '';
            stringDate += DateValueComponent.isNumber(this.dateStruct.month)
                ? DateValueComponent.padNumber(this.dateStruct.month) + '.'
                : '';
            return stringDate + this.dateStruct.year;
        }
    }


    public getAvailableTimezones(): string[] {

        return Intl.supportedValuesOf('timeZone');
    }


    public remove() {

        this.dateStruct = {} as NgbDateStruct;
        this.time = {};
        this.value = undefined;
        this.onChanged.emit(undefined);
    }


    private async focusInputField() {

        await AngularUtility.refresh();

        if (this.dateInputElement) {
            this.dateInputElement.nativeElement.focus();
        };
    }


    private async blurInputField() {

        await AngularUtility.refresh();

        if (this.dateInputElement) {
            this.dateInputElement.nativeElement.blur();
        };
    }


    private setSystemTimezone() {

        this.selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }


    private listenToScrollEvents() {

        this.scrollListenerInitialized = false;

        this.onScrollListener = this.onScroll(this.datePicker).bind(this);
        window.addEventListener('scroll', this.onScrollListener, true);
    }  


    private updateDateStruct() {

        if (!this.value) {
            this.dateStruct = {} as NgbDateStruct;
            return;
        }

        const parsedDate: Date = toZonedTime(
            parseDate(this.value),
            this.selectedTimezone
        );

        const dateSegmentsCount: number = this.value.split('.').length;

        this.dateStruct = {
            year: parsedDate.getFullYear(),
            month: dateSegmentsCount > 1 ? parsedDate.getMonth() + 1 : undefined,
            day: dateSegmentsCount > 2 ? parsedDate.getDate() : undefined
        };
    }


    private updateTime() {

        if (!this.value || !this.value.includes(':')) {
            this.time = {};
            return;
        }

        const parsedDate: Date = toZonedTime(
            parseDate(this.value),
            this.selectedTimezone
        );

        this.time = {
            hours: parsedDate.getHours(),
            minutes: parsedDate.getMinutes()
        };
    }


    private buildValue(): string|undefined {

        let formattedDate: string = this.getFormattedDate();
        if (!formattedDate || (this.isTimeMandatory() && !DateValueComponent.isFullDate(formattedDate))) {
            return undefined;
        }

        if (this.isTimeSelected()) formattedDate += ' ' + this.getFormattedTime();

        if (isNaN(parseDate(formattedDate)?.getTime())) return undefined;

        return this.isTimeSelected()
            ? this.applySelectedTimezone(formattedDate)
            : formattedDate;
    }


    private getFormattedTime(): string|undefined {

        return DateValueComponent.padNumber(this.time.hours) + ':'
            + DateValueComponent.padNumber(this.time.minutes);
    }


    private isTimeSelected(): boolean {

        return DateValueComponent.isNumber(this.time?.hours)
            && DateValueComponent.isNumber(this.time?.minutes);
    }


    private isTimeSupported() {
        
        return this.field.dateConfiguration.dataType !== DateConfiguration.DataType.DATE;
    }


    private isTimeMandatory() {
        
        return this.field.dateConfiguration.dataType === DateConfiguration.DataType.DATE_TIME;
    }


    private applySelectedTimezone(formattedDate: string): string {

        const date: Date = parseDate(formattedDate, this.selectedTimezone);
        return formatDate(date, undefined, 'UTC', 'shortTime');
    }


    private onScroll = (datePicker: NgbInputDatepicker) => _ => {

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


    private static isFullDate(formattedDate: string): boolean {

        return formattedDate && formattedDate.split('.').length === 3;
    }
}
