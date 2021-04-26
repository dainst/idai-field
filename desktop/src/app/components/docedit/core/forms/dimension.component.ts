import {Component, Input} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {clone} from 'tsfun';
import {Resource, Dimension} from 'idai-field-core';
import {UtilTranslations} from '../../../../core/util/util-translations';
import {FieldDefinition} from 'idai-field-core';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';


type DimensionInEditing = { original: Dimension, clone: Dimension };


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
    public dimensionsInEditing: Array<DimensionInEditing> = [];


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

        if (dimension.label) return dimension.label;

        return Dimension.generateLabel(
            dimension,
            (value: any) => this.decimalPipe.transform(value),
            (key: string) => this.utilTranslations.getTranslation(key),
            this.getPositionValueLabel(dimension.measurementPosition)
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

        const clonedDimension = clone(dimension);
        clonedDimension.isRange = clonedDimension.inputRangeEndValue ? true : false;

        this.dimensionsInEditing.push({ original: dimension, clone: clonedDimension });
    }


    private stopEditing(dimension: Dimension) {

        this.dimensionsInEditing === this.dimensionsInEditing.filter(d => d.clone !== dimension);
    }


    public isInEditing(dimension: Dimension): boolean {

        return this.dimensionsInEditing.find(d => d.original === dimension) !== undefined;
    }


    public getClone(dimension: Dimension): Dimension|undefined {

        const dimensionInEditing = this.dimensionsInEditing.find(d => d.original === dimension);
        if (dimensionInEditing) return dimensionInEditing.clone;
    }


    public getOriginal(clonedDimension: Dimension): Dimension|undefined {

        const dimensionInEditing = this.dimensionsInEditing.find(d => d.clone === clonedDimension);
        if (dimensionInEditing) return dimensionInEditing.original;
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

        delete dimension.isRange;
        Dimension.addNormalizedValues(dimension);

    	if (this.newDimension === dimension) {
            if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
    		this.resource[this.field.name].push(dimension);
            this.newDimension = undefined;
    	} else {
            const index: number = this.resource[this.field.name].indexOf(this.getOriginal(dimension));
            this.resource[this.field.name].splice(index, 1, dimension);
            this.stopEditing(dimension);
        }
    }
}
