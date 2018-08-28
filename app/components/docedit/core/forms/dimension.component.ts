import {Component, Input} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-dimension',
    templateUrl: './dimension.html'
})

/**
 * @author Fabian Z.
 */
export class DimensionComponent {

    @Input() resource: Resource;
    @Input() field: any;

    public newDimension: any = null;


    constructor(private decimalPipe: DecimalPipe) {}


    public createNewDimension() {

    	this.newDimension = {
    		'new': true,
    		'value': 0,
            'inputValue': 0,
            'inputRangeEndValue': 0,
			'measurementPosition': '',
			'measurementComment': '',
			'inputUnit': 'cm',
			'isImprecise': false,
            'isRange': false,
			'label': ''
    	};
    }


    private convertValueFromInputUnitToMicrometre(inputUnit: string, inputValue: string): Number|undefined {

    	let _val = parseFloat(inputValue);
        if (inputUnit == 'mm') return _val * 1000;
    	if (inputUnit == 'cm') return _val * 10000;
    	if (inputUnit == 'm') return _val * 1000000;
    }


    private generateLabel(dimension: any) {

        let label = (dimension['isImprecise'] ? 'ca. ' : '');

        if (dimension.isRange) {
            label += `${this.decimalPipe.transform(dimension['inputValue'])}-${this.decimalPipe.transform(dimension['inputRangeEndValue'])}`;
        } else {
            label += this.decimalPipe.transform(dimension['inputValue']);
        }

        label += ` ${dimension['inputUnit']}`;

        if (this.field.unitSuffix && this.field.unitSuffix != '') label += ` ${this.field.unitSuffix}`;

    	if (dimension['measurementPosition']) label += `, Gemessen an ${dimension['measurementPosition']}`;
    	if (dimension['measurementComment']) label += ` (${dimension['measurementComment']})`;

        dimension['label'] = label;
    }


    public cancelNewDimension() {

        this.newDimension = null;
    }


    public removeDimensionAtIndex(dimensionIndex: number) {

        this.resource[this.field.name].splice(dimensionIndex, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public saveDimension(dimension: any) {

    	if (!this.resource[this.field.name]) this.resource[this.field.name] = [];

        if (dimension.isRange) {
            dimension['rangeMin'] = this.convertValueFromInputUnitToMicrometre(dimension['inputUnit'],
                dimension['inputValue']);
            dimension['rangeMax'] = this.convertValueFromInputUnitToMicrometre(dimension['inputUnit'],
                dimension['inputRangeEndValue']);
            delete(dimension['value']);
        } else {
    	    dimension['value'] = this.convertValueFromInputUnitToMicrometre(dimension['inputUnit'],
                dimension['inputValue']);
        }

    	this.generateLabel(dimension);

        if (this.field.unitSuffix && this.field.unitSuffix != '') dimension['unitSuffix'] = this.field.unitSuffix;

    	if (dimension['new']) {
    		delete dimension['new'];
    		this.resource[this.field.name].push(dimension);
            this.newDimension = null;
    	} else {
    	    delete dimension['editing'];
        }
    }
}