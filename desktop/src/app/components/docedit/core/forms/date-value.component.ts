import { ChangeDetectorRef, Component, ElementRef, Input, Output, ViewChild, EventEmitter,
    OnInit } from '@angular/core';
import { NgbDateStruct, NgbInputDatepicker, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { toZonedTime } from 'date-fns-tz';
import { isString } from 'tsfun';
import { DateConfiguration, Field, formatDate, parseDate } from 'idai-field-core';
import { AngularUtility } from '../../../../angular/angular-utility';


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

    public dateStruct: NgbDateStruct;
    public timeStruct: NgbTimeStruct;

    public selectedTimezone: string;

    public onScrollListener: any;
    public scrollListenerInitialized: boolean = false;    


    constructor(private changeDetectorRef: ChangeDetectorRef) {}


    public isDatePickerVisible = () => this.value === undefined;

    public isTimePickerVisible = () => this.value?.split('.').length > 2
        && this.field.dateConfiguration?.dataType !== DateConfiguration.DataType.DATE;

    public getTimezoneLabel = (timezone: string) => timezone;


    ngOnInit() {

        this.setSystemTimezone();
        this.updateTimeStruct();
        this.updateDateStruct();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Enter') this.update();
    }


    public async update() {

        this.value = this.buildValue();
        this.onChanged.emit(this.value);

        if (!this.value) {
            await this.focusInputField();
        }
    }


    public selectTimezone(timezone: string) {

        this.selectedTimezone = timezone;
        this.update();
    }


    public async focusInputField() {

        await AngularUtility.refresh();

        if (this.dateInputElement) {
            this.dateInputElement.nativeElement.focus();
        };
    }


    public removeValue() {

        this.value = undefined;
        this.onChanged.emit(undefined);
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


    private setSystemTimezone() {

        this.selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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


    private updateTimeStruct() {

        if (!this.value || !this.value.includes(':')) return;

        const parsedDate: Date = toZonedTime(
            parseDate(this.value),
            this.selectedTimezone
        );

        this.timeStruct = { hour: parsedDate.getHours(), minute: parsedDate.getMinutes(), second: 0 };
    }


    private buildValue(): string|undefined {

        let formattedDate: string = this.getFormattedDate();
        if (!formattedDate) return undefined;

        if (this.isTimeSelected()) formattedDate += ' ' + this.getFormattedTime();

        if (isNaN(parseDate(formattedDate)?.getTime())) return undefined;

        return this.isTimeSelected()
            ? this.applySelectedTimezone(formattedDate)
            : formattedDate;
    }


    private getFormattedTime(): string|undefined {

        return DateValueComponent.padNumber(this.timeStruct.hour) + ':'
            + DateValueComponent.padNumber(this.timeStruct.minute);
    }


    private isTimeSelected(): boolean {

        return DateValueComponent.isNumber(this.timeStruct?.hour)
            && DateValueComponent.isNumber(this.timeStruct?.minute);
    }


    private applySelectedTimezone(formattedDate: string): string {

        const date: Date = parseDate(formattedDate, this.selectedTimezone);
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
