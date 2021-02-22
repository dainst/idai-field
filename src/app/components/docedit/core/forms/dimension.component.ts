import {Component, Input} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {Resource, Dimension} from 'idai-components-2';
import {UtilTranslations} from '../../../../core/util/util-translations';
import {FieldDefinition} from '../../../../core/configuration/model/field-definition';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';


@Component({
    selector: 'dai-dimension',
    templateUrl: './dimension.html'
})

/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class DimensionComponent {

    @Input() resource: Resource;
    @Input() field: FieldDefinition;

    public newDimension: Dimension|undefined = undefined;
    public dimensionsInEditing: Array<Dimension> = [];


    constructor(private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations) {}


    public createNewDimension() {

    	this.newDimension = {
    		value: 0,
            inputValue: 0,
			measurementPosition: '',
			measurementComment: '',
			inputUnit: 'cm',
			isImprecise: false
    	};

        (this.newDimension as any)['isRange'] = false;
    }


    public getLabel(dimension: Dimension): string {

        return dimension.label
            ? dimension.label
            : Dimension.generateLabel(
                dimension,
                (value: any) => this.decimalPipe.transform(value),
                (key: string) => this.utilTranslations.getTranslation(key),
                dimension.measurementPosition
                    ? this.getPositionValueLabel(dimension.measurementPosition)
                    : undefined
                );
    }


    public getPositionValues(): string[] {

        return Object.keys(this.field['positionValues'].values);
    }


    public getPositionValueLabel(valueId: string): string {

        return ValuelistUtil.getValueLabel(this.field['positionValues'], valueId);
    }


    public cancelNewDimension() {

        this.newDimension = undefined;
    }


    public startEditing(dimension: Dimension) {

        dimension.isRange = dimension.inputRangeEndValue ? true : false;

        this.dimensionsInEditing.push(dimension);
    }


    private stopEditing(dimension: Dimension) {

        const index: number = this.dimensionsInEditing.indexOf(dimension);
        if (index > -1) this.dimensionsInEditing.splice(index, 1);
    }


    public isInEditing(dimension: Dimension) {

        return this.dimensionsInEditing.includes(dimension);
    }


    public removeDimensionAtIndex(dimensionIndex: number) {

        this.resource[this.field.name].splice(dimensionIndex, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public toggleRangeOnOff(dimension: Dimension, toggleRangeOn: boolean) {

        if (toggleRangeOn) dimension.inputRangeEndValue = 0;
        else delete dimension.inputRangeEndValue;
    }


    public saveDimension(dimension: Dimension) {

        delete (dimension as any)['isRange'];
        Dimension.addNormalizedValues(dimension);

    	if (this.newDimension === dimension) {
            if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
    		this.resource[this.field.name].push(dimension);
            this.newDimension = undefined;
    	} else {
            this.stopEditing(dimension);
        }
    }
}
