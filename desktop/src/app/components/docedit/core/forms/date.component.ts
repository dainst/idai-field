import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { isString } from 'tsfun';
import { Field, parseDate } from 'idai-field-core';
import { AngularUtility } from '../../../../angular/angular-utility';
import { ComponentHelpers } from '../../../component-helpers';


@Component({
    selector: 'form-field-date',
    templateUrl: './date.html',
    standalone: false
})
export class DateComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() field: Field;

    @ViewChild('dateInput', { static: false }) dateInputElement: ElementRef;

    public dateStruct: NgbDateStruct;
    public onScrollListener: any;
    public scrollListenerInitialized: boolean = false;


    constructor(public dateFormatter: NgbDateParserFormatter,
                private changeDetectorRef: ChangeDetectorRef) {}


    public getFieldData = () => this.fieldContainer[this.field.name];

    public isDatePickerVisible = () => this.getFieldData() === undefined;


    ngOnChanges() {
        
        this.updateDateStruct(this.getFieldData());
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Enter') this.update();
    }


    public update() {

        const formattedDate: string = isString(this.dateStruct)
            ? this.dateStruct
            : this.dateFormatter.format(this.dateStruct);

        if (!isNaN(parseDate(formattedDate)?.getTime())) {
            this.fieldContainer[this.field.name] = formattedDate;
        } else {
            delete this.fieldContainer[this.field.name];
        }

        this.updateDateStruct(formattedDate);
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


    private updateDateStruct(date: string) {

        this.dateStruct = this.dateFormatter.parse(date) ?? {} as NgbDateStruct;
    }


    private onScroll = (datePicker: NgbInputDatepicker) => (event: MouseEvent) => {

        if (!this.scrollListenerInitialized) {
            this.scrollListenerInitialized = true;
            return;
        }

        if (!ComponentHelpers.isInside(event.target, target => target.localName === 'ngb-datapicker')) { 
            datePicker.close();
            this.changeDetectorRef.detectChanges();
        }
    }
}
