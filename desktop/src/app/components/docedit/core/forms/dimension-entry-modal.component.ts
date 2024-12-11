import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map } from 'tsfun';
import { Dimension, Labels, ProjectConfiguration, Valuelist } from 'idai-field-core';
import { Language, Languages } from '../../../../services/languages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';



@Component({
    templateUrl: './dimension-entry-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class DimensionEntryModalComponent {

    public entry: Dimension;
    public isNew: boolean;
    public languages: Map<Language>;
    public valuelist: Valuelist;

    public fieldLanguages: Array<Language>;
    public isRange: boolean;

    constructor(private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private activeModal: NgbActiveModal,
                private menus: Menus) {}
    
    
    public cancel = () => this.activeModal.dismiss();
    
    public validate = () => Dimension.isValid(this.entry);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss();
        }
    }


    public async initialize() {

        if (this.isNew) this.entry = DimensionEntryModalComponent.createEmptyEntry();

        this.fieldLanguages = await this.getFieldLanguages();
        this.isRange = this.entry.inputRangeEndValue !== undefined ? true : false;
    }


    public getPositionValues(): string[] {

        return Object.keys(this.valuelist.values);
    }


    public getPositionValueLabel(valueId: string): string {

        return this.labels.getValueLabel(this.valuelist, valueId);
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
        Dimension.addNormalizedValues(this.entry);
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


    private static createEmptyEntry(): Dimension {

        return  {
            value: 0,
            inputValue: 0,
            measurementPosition: '',
            inputUnit: 'cm',
            isImprecise: false
        };
    }
}
