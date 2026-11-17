import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map } from 'tsfun';
import { Measurement, Labels, ProjectConfiguration, Valuelist } from 'idai-field-core';
import { Language, Languages } from '../../../../../services/languages';
import { SettingsProvider } from '../../../../../services/settings/settings-provider';
import { Menus } from '../../../../../services/menus';
import { MenuContext } from '../../../../../services/menu-context';



@Component({
    templateUrl: './measurement-entry-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class MeasurementEntryModalComponent {

    public entry: Measurement;
    public inputType: 'dimension'|'weight'|'volume';
    public isNew: boolean;
    public languages: Map<Language>;
    public valuelist: Valuelist;

    public fieldLanguages: Array<Language>;
    public isRange: boolean;
    public valueIds: string[];

    constructor(private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private activeModal: NgbActiveModal,
                private menus: Menus) {}


    public getValueLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);

    public cancel = () => this.activeModal.dismiss();
    
    public validate = () => Measurement.isValid(this.entry, this.inputType);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss();
        } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
            this.confirm();
        }
    }


    public async initialize() {

        if (this.isNew) this.entry = this.createEmptyEntry();

        this.fieldLanguages = await this.getFieldLanguages();
        this.isRange = this.entry.inputRangeEndValue !== undefined ? true : false;
        this.valueIds = this.labels.orderKeysByLabels(this.valuelist);
    }


    public toggleRange(isRange: boolean) {

        if (isRange) {
            this.entry.inputRangeEndValue = 0;
        } else {
            delete this.entry.inputRangeEndValue;
        }
    }


    public updateMeasurementComment(measurementComment: any) {

        if (measurementComment) {
            this.entry.measurementComment = measurementComment;
        } else {
            delete this.entry.measurementComment;
        }
    }


    public confirm() {

        if (!this.validate()) return;

        this.cleanUp();
        this.activeModal.close(this.entry);
    }


    private cleanUp() {

        delete this.entry.isRange;
        Measurement.addNormalizedValues(this.entry);
    }


    private getFieldLanguages(): Array<Language> {

        return Languages.getFieldLanguages(
            this.entry.measurementComment,
            this.languages,
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            $localize `:@@languages.noLanguage:Ohne Sprachangabe`
        );
    }


    private createEmptyEntry(): Measurement {

        return  {
            value: 0,
            inputValue: 0,
            inputUnit: this.getDefaultInputUnit(),
            isImprecise: false
        };
    }


    private getDefaultInputUnit(): Measurement.InputUnit {

        switch (this.inputType) {
            case 'dimension':
                return 'cm';
            case 'weight':
                return 'g';
            case 'volume':
                return 'ml';
        }
    }
}
