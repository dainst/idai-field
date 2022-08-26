import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, Map } from 'tsfun';
import { Dimension, Labels, Field, Resource, I18N, ProjectConfiguration } from 'idai-field-core';
import { UtilTranslations } from '../../../../util/util-translations';
import { Language, Languages } from '../../../../services/languages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';


type DimensionInEditing = { original: Dimension, clone: Dimension };


@Component({
    selector: 'form-field-dimension',
    templateUrl: './dimension.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class DimensionComponent {

    @Input() resource: Resource;
    @Input() field: Field;
    @Input() languages: Map<Language>;

    public newDimension: Dimension|undefined = undefined;
    public dimensionsInEditing: Array<DimensionInEditing> = [];
    public fieldLanguages: Array<Language>;


    constructor(private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private i18n: I18n) {}

    
    public isValid = (dimension: Dimension) => Dimension.isValid(dimension);

    public isEditing = () => this.dimensionsInEditing.length > 0;

    public isEditingAllowed = () => !this.isEditing() && !this.newDimension;


    public createNewDimension() {

    	this.newDimension = {
    		value: 0,
            inputValue: 0,
			measurementPosition: '',
			inputUnit: 'cm',
			isImprecise: false
    	};

        (this.newDimension as any)['isRange'] = false;

        this.updateFieldLanguages(this.newDimension);
    }


    public getLabel(dimension: Dimension): string {

        if (dimension.label) return dimension.label;

        return Dimension.generateLabel(
            dimension,
            (value: any) => this.decimalPipe.transform(value),
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: I18N.String|string) => this.labels.getFromI18NString(value),
            this.getPositionValueLabel(dimension.measurementPosition)
        );
    }


    public getPositionValues(): string[] {

        return Object.keys(this.field['valuelist'].values);
    }


    public getPositionValueLabel(valueId: string): string {

        return this.labels.getValueLabel(this.field['valuelist'], valueId);
    }


    public cancelNewDimension() {

        this.newDimension = undefined;
    }


    public startEditing(dimension: Dimension) {

        this.updateFieldLanguages(dimension);

        const clonedDimension = clone(dimension);
        clonedDimension.isRange = clonedDimension.inputRangeEndValue ? true : false;

        this.dimensionsInEditing.push({ original: dimension, clone: clonedDimension });
    }


    private stopEditing(dimension: Dimension) {

        this.dimensionsInEditing = this.dimensionsInEditing.filter(d => d.clone !== dimension);
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


    public updateMeasurementComment(dimension: Dimension, measurementComment: any) {

        if (measurementComment) {
            dimension.measurementComment = measurementComment;
        } else {
            delete dimension.measurementComment;
        }
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


    private updateFieldLanguages(dimension: Dimension) {

        this.fieldLanguages = Languages.getFieldLanguages(
            dimension.measurementComment,
            this.languages,
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            this.i18n({ id: 'languages.noLanguage', value: 'Ohne Sprachangabe' })
        );
    }
}
