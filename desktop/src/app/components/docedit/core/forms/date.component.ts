import {Component, Input} from '@angular/core';
import {NgbDateParserFormatter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {Resource} from 'idai-field-core';


@Component({
    selector: 'dai-date',
    templateUrl: './date.html'
})
export class DateComponent {

    @Input() resource: Resource;

    @Input('field')
    set field(value: any) {

        this._field = value;
        this.dateStruct = this.dateFormatter.parse(this.resource[this._field.name]);

        if (!this.dateStruct) {
            if (this.resource[this._field.name]) this.dateNotParsed = true;
        } else {
            if (!this.dateStruct.month) this.dateStruct.month = 1;
            if (!this.dateStruct.day) this.dateStruct.day = 1;
        }
    }

    public dateStruct: NgbDateStruct;

    public dateNotParsed = false;

    public _field : any;


    constructor(public dateFormatter: NgbDateParserFormatter) {}


    public update(newValue: any) {

        const formattedDate: string = this.dateFormatter.format(newValue);

        if (formattedDate !== '') {
            this.resource[this._field.name] = formattedDate;
        } else {
            delete this.resource[this._field.name];
        }

        this.dateNotParsed = false;
    }
}
