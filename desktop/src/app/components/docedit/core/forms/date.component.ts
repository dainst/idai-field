import { Component, Input, OnChanges } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { isString } from 'tsfun';
import { Field, parseDate, Resource } from 'idai-field-core';


@Component({
    selector: 'dai-date',
    templateUrl: './date.html'
})
export class DateComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: Field;

    public dateStruct: NgbDateStruct;


    constructor(public dateFormatter: NgbDateParserFormatter) {}


    public isDatePickerVisible = () => (this.dateStruct.day && this.dateStruct.month) || !this.dateStruct.year;

    public getFieldData = () => this.resource[this.field.name];


    ngOnChanges() {
        
        this.dateStruct = this.dateFormatter.parse(this.getFieldData()) ?? {} as NgbDateStruct;
    }


    public update(newValue: any) {

        const formattedDate: string = isString(newValue) ? newValue : this.dateFormatter.format(newValue);

        if (!isNaN(parseDate(formattedDate)?.getTime())) {
            this.resource[this.field.name] = formattedDate;
        } else {
            delete this.resource[this.field.name];
        }

        this.dateStruct = this.dateFormatter.parse(formattedDate);
    }


    public removeFieldData() {

        delete this.resource[this.field.name];
        this.dateStruct = {} as NgbDateStruct;
    }
}
