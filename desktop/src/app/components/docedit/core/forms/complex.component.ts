import { Component, Input, OnChanges } from '@angular/core';
import { Map, clone } from 'tsfun';
import { Field, Labels, Resource, Complex, I18N, Valuelist} from 'idai-field-core';
import { Language } from '../../../../services/languages';
import { UtilTranslations } from '../../../../util/util-translations';
import { Messages } from '../../../messages/messages';
import { Modals } from '../../../../services/modals';
import { ComplexEntryModalComponent } from './complex-entry-modal.component';
import { MenuContext } from '../../../../services/menu-context';
import { AngularUtility } from '../../../../angular/angular-utility';


@Component({
    selector: 'form-field-complex',
    templateUrl: './complex.html'
})
/**
 * @author Thomas Kleinke
 */
export class ComplexComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: Field;
    @Input() languages: Map<Language>;

    public fieldLanguages: Array<Language>;
    public entryLabels: Array<string|null>;
    public subfieldLabels: Map<string> = {};
    public subfieldDescriptions: Map<string> = {};


    constructor(private labels: Labels,
                private utilTranslations: UtilTranslations,
                private messages: Messages,
                private modals: Modals) {}


    public createEntry = () => this.editEntry({}, true);


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
        this.updateEntryLabels();
    }


    public removeEntryAtIndex(entryIndex: number) {

        this.resource[this.field.name].splice(entryIndex, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public editEntry(entry: any, isNew: boolean = false) {

        const [result, componentInstance] = this.modals.make<ComplexEntryModalComponent>(
            ComplexEntryModalComponent,
            MenuContext.MODAL,
            undefined, 'complex-entry-modal', false
        );

        componentInstance.entry = clone(entry);
        componentInstance.subfields = this.field.subfields;
        componentInstance.resource = this.resource;
        componentInstance.isNew = isNew;
        componentInstance.languages = this.languages;
        componentInstance.subfieldLabels = this.subfieldLabels;
        componentInstance.subfieldDescriptions = this.subfieldDescriptions;

        this.modals.awaitResult(result,
            (editedEntry) => {
                if (isNew) {
                    if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
                    this.resource[this.field.name].push(editedEntry);
                } else {
                    const index: number = this.resource[this.field.name].indexOf(entry);
                    this.resource[this.field.name].splice(index, 1, editedEntry);
                }
        
                this.updateEntryLabels();
            },
            () => AngularUtility.blurActiveElement()
        );
    }


    private updateLabelsAndDescriptions() {

        this.field.subfields.forEach(subfield => {
            const { label, description } = this.labels.getLabelAndDescription(subfield);
            if (label) this.subfieldLabels[subfield.name] = label;
            if (description) this.subfieldDescriptions[subfield.name] = description;
        });
    }

    
    private updateEntryLabels() {

        const entries: any[] = this.resource[this.field.name] ?? [];
        this.entryLabels = entries.map((entry) => this.generateEntryLabel(entry));
    }


    private generateEntryLabel(entry: any): string {

        return Complex.generateLabel(
            entry,
            this.field.subfields,
            (key: string) => this.utilTranslations.getTranslation(key),
            (labeledValue: I18N.LabeledValue) => this.labels.get(labeledValue),
            (value: I18N.String|string) => this.labels.getFromI18NString(value),
            (valuelist: Valuelist, valueId: string) => this.labels.getValueLabel(valuelist, valueId)
        );
    }
}
