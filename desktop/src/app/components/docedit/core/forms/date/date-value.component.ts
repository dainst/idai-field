import { ChangeDetectorRef, Component, ElementRef, Input, Output, ViewChild, EventEmitter,
    OnInit } from '@angular/core';
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { toZonedTime } from 'date-fns-tz';
import { DateConfiguration, Field, formatDate, parseDate } from 'idai-field-core';
import { AngularUtility } from '../../../../../angular/angular-utility';
import { TimeSpecification } from './time-input.component';
import { DateParserFormatter } from './date-parser-formatter';
import { NumberUtil } from '../../../../../util/number-util';


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


    constructor(private changeDetectorRef: ChangeDetectorRef,
                private dateParserFormatter: DateParserFormatter) {}


    public isDatePickerVisible = () => this.value === undefined;

    public isNowButtonVisible = () => this.isDatePickerVisible() && !this.isTimeInputVisible() && !this.editing;

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


    public isTimeInputVisible(): boolean {

        return (this.isTimeSupported() || this.isTimeSelected())
            && (DateValueComponent.isFullDate(this.value)
                || (this.editing && DateValueComponent.isFullDate(this.originalValue)));
    }


    public selectTimezone(timezone: string) {

        this.selectedTimezone = timezone;
        this.dateParserFormatter.setSelectedTimezone(timezone);
        this.update();
    }


    public async editDate() {

        this.editing = true;
        this.originalValue = this.value;
        this.originalDateStruct = this.dateStruct;
        this.value = undefined;

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


    public openDatePicker() {

        this.datePicker.open();
        this.focusInputField();
        this.listenToScrollEvents();
    }


    public toggleDatePicker() {

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

        return this.dateParserFormatter.format(this.dateStruct);
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
        this.dateParserFormatter.setSelectedTimezone(this.selectedTimezone);
    }


    private listenToScrollEvents() {

        this.scrollListenerInitialized = false;

        this.onScrollListener = this.onScroll(this.datePicker).bind(this);
        window.addEventListener('scroll', this.onScrollListener, true);
    }  


    private updateDateStruct() {

        this.dateStruct = this.dateParserFormatter.parse(this.value);
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

        return NumberUtil.padNumber(this.time.hours) + ':'
            + NumberUtil.padNumber(this.time.minutes);
    }


    private isTimeSelected(): boolean {

        return NumberUtil.isNumber(this.time?.hours)
            && NumberUtil.isNumber(this.time?.minutes);
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


    private static isFullDate(formattedDate: string): boolean {

        return formattedDate && formattedDate.split('.').length === 3;
    }
}
