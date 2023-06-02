import { Component, Input, OnChanges } from '@angular/core';
import { Map, clone } from 'tsfun';
import { Field, Subfield, Labels, Resource } from 'idai-field-core';
import { Language } from '../../../../services/languages';


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


    constructor(private labels: Labels) {}

    
    public isValid = (entry: any) => true; // TODO Implement

    public isEditing = (entry: any) => this.entryInEditing?.original === entry

    public isEditingAllowed = () => !this.entryInEditing && !this.newEntry;

    public getSubfieldLabel = (subfield: Subfield) => this.subfieldLabels[subfield.name];

    public getSubfieldDescription = (subfield: Subfield) => this.subfieldDescriptions[subfield.name];


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
    }


    public createNewEntry() {

    	this.newEntry = {};
    }


    public getLabel(entry: any): string {

        // TODO Implement

        return JSON.stringify(entry);
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
