import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { isString } from 'tsfun';
import { Field, parseDate } from 'idai-field-core';
import { AngularUtility } from '../../../../angular/angular-utility';


@Component({
    selector: 'form-field-date',
    templateUrl: './date.html'
})
export class DateComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() field: Field;

    @ViewChild('dateInput', { static: false }) dateInputElement: ElementRef;

    public dateStruct: NgbDateStruct;


    constructor(public dateFormatter: NgbDateParserFormatter) {}


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


    private updateDateStruct(date: string) {

        this.dateStruct = this.dateFormatter.parse(date) ?? {} as NgbDateStruct;
    }
}
