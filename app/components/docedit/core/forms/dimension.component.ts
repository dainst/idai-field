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
    		'hasValue': 0,
            'hasInputValue': 0,
            'hasInputRangeEndValue': 0,
			'hasMeasurementPosition': '',
			'hasMeasurementComment': '',
			'hasInputUnit': 'cm',
			'isImprecise': false,
            'isRange': false,
			'hasLabel': ''
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
            label += `${this.decimalPipe.transform(dimension['hasInputValue'])}-${this.decimalPipe.transform(dimension['hasInputRangeEndValue'])}`;
        } else {
            label += this.decimalPipe.transform(dimension['hasInputValue']);
        }

        label += ` ${dimension['hasInputUnit']}`;

        if (this.field.unitSuffix && this.field.unitSuffix != '') label += ` ${this.field.unitSuffix}`;

    	if (dimension['hasMeasurementPosition']) label += `, Gemessen an ${dimension['hasMeasurementPosition']}`;
    	if (dimension['hasMeasurementComment']) label += ` (${dimension['hasMeasurementComment']})`;

        dimension['hasLabel'] = label;
    }


    public cancelNewDimension() {

        this.newDimension = null;
    }


    public removeDimensionAtIndex(dimensionIndex: number) {

        this.resource[this.field.name].splice(dimensionIndex, 1);
    }


    public saveDimension(dimension: any) {

    	if (!this.resource[this.field.name]) this.resource[this.field.name] = [];

        if (dimension.isRange) {
            dimension['hasRangeMin'] = this.convertValueFromInputUnitToMicrometre(dimension['hasInputUnit'],
                dimension['hasInputValue']);
            dimension['hasRangeMax'] = this.convertValueFromInputUnitToMicrometre(dimension['hasInputUnit'],
                dimension['hasInputRangeEndValue']);
            delete(dimension['hasValue']);
        } else {
    	    dimension['hasValue'] = this.convertValueFromInputUnitToMicrometre(dimension['hasInputUnit'],
                dimension['hasInputValue']);
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