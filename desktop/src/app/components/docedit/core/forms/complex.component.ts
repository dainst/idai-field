import { Component, Input, OnChanges } from '@angular/core';
import { Map, clone } from 'tsfun';
import { Field, Subfield, Labels, Resource, Complex, I18N, Valuelist } from 'idai-field-core';
import { Language } from '../../../../services/languages';
import { UtilTranslations } from '../../../../util/util-translations';


type EntryInEditing = { original: any, clone: any };


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

    public newEntry: any|undefined = undefined;
    public entryInEditing: EntryInEditing = undefined;
    public fieldLanguages: Array<Language>;
    
    private subfieldLabels: Map<string> = {};
    private subfieldDescriptions: Map<string> = {};


    constructor(private labels: Labels,
                private utilTranslations: UtilTranslations) {}

    
    public isValid = (entry: any) => true; // TODO Implement

    public isEditing = (entry: any) => this.entryInEditing?.original === entry

    public isEditingAllowed = () => !this.entryInEditing && !this.newEntry;

    public getSubfieldLabel = (subfield: Subfield) => this.subfieldLabels[subfield.name];

    public getSubfieldDescription = (subfield: Subfield) => this.subfieldDescriptions[subfield.name];


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
    }


    public getSubfields(): Array<Subfield> {
        
        return this.field.subfields?.filter(subfield => {
            return Complex.ALLOWED_SUBFIELD_INPUT_TYPES.includes(subfield.inputType);
        });
    }


    public createNewEntry() {

    	this.newEntry = {};
    }


    public getLabel(entry: any): string {

        return Complex.generateLabel(
            entry,
            this.field.subfields,
            (key: string) => this.utilTranslations.getTranslation(key),
            (labeledValue: I18N.LabeledValue) => this.labels.get(labeledValue),
            (value: I18N.String|string) => this.labels.getFromI18NString(value),
            (valuelist: Valuelist, valueId: string) => this.labels.getValueLabel(valuelist, valueId)
        );
    }


    public cancelNewEntry() {

        this.newEntry = undefined;
    }


    public removeEntryAtIndex(entryIndex: number) {

        this.resource[this.field.name].splice(entryIndex, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public saveEntry(entry: any) {

    	if (this.newEntry === entry) {
            if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
    		this.resource[this.field.name].push(entry);
            this.newEntry = undefined;
    	} else {
            const index: number = this.resource[this.field.name].indexOf(this.entryInEditing.original);
            this.resource[this.field.name].splice(index, 1, entry);
            this.stopEditing();
        }
    }


    public startEditing(entry: any) {

        this.entryInEditing = { original: entry, clone: clone(entry) };
    }


    private stopEditing() {

        this.entryInEditing = undefined;
    }


    private updateLabelsAndDescriptions() {

        this.field.subfields.forEach(subfield => {
            const { label, description } = this.labels.getLabelAndDescription(subfield);
            if (label) this.subfieldLabels[subfield.name] = label;
            if (description) this.subfieldDescriptions[subfield.name] = description;
        });
    }
}
