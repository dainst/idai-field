import {Component, Input} from '@angular/core';
import {NgbDateParserFormatter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
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

    private _field : any;


    constructor(public dateFormatter: NgbDateParserFormatter) {}


    public update(newValue: any) {

        this.resource[this._field.name] = this.dateFormatter.format(newValue);
        this.dateNotParsed = false;
    }
}