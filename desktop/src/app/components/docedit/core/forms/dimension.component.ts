import { Component, Input, OnChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, Map } from 'tsfun';
import { Dimension, Labels, Field, I18N, ProjectConfiguration, Valuelist, ValuelistUtil, Datastore, Hierarchy, Resource } from 'idai-field-core';
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
export class DimensionComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() fieldContainer: any;
    @Input() field: Field;
    @Input() languages: Map<Language>;

    public newDimension: Dimension|undefined = undefined;
    public dimensionInEditing: DimensionInEditing = undefined;
    public fieldLanguages: Array<Language>;

    public valuelist: Valuelist;


    constructor(private decimalPipe: DecimalPipe,
                private utilTranslations: UtilTranslations,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private datastore: Datastore,
                private i18n: I18n) {}

    
    public isValid = (dimension: Dimension) => Dimension.isValid(dimension);

    public isEditing = (dimension: Dimension) => this.dimensionInEditing?.original === dimension

    public isEditingAllowed = () => !this.dimensionInEditing && !this.newDimension;


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.projectConfiguration,
            await Hierarchy.getParentResource(id => this.datastore.get(id), this.resource)
        );
    }


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

        this.dimensionInEditing = { original: dimension, clone: clonedDimension };
    }


    private stopEditing() {

        this.dimensionInEditing = undefined;
    }


    public removeDimensionAtIndex(dimensionIndex: number) {

        this.fieldContainer[this.field.name].splice(dimensionIndex, 1);
        if (this.fieldContainer[this.field.name].length === 0) delete this.fieldContainer[this.field.name];
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
            if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = [];
    		this.fieldContainer[this.field.name].push(dimension);
            this.newDimension = undefined;
    	} else {
            const index: number = this.fieldContainer[this.field.name].indexOf(this.dimensionInEditing.original);
            this.fieldContainer[this.field.name].splice(index, 1, dimension);
            this.stopEditing();
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
