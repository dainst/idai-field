import { Component, Input, OnChanges } from '@angular/core';
import { Map, clone, isArray, isEmpty, intersect, on, is } from 'tsfun';
import { Field, Subfield, Labels, Resource, Complex, I18N, Valuelist, validateInt, validateFloat,
    validateUnsignedInt, validateUnsignedFloat, validateUrl, Named } from 'idai-field-core';
import { Language } from '../../../../services/languages';
import { UtilTranslations } from '../../../../util/util-translations';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';


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
    public entryLabels: Array<string|null>;
    
    private subfieldLabels: Map<string> = {};
    private subfieldDescriptions: Map<string> = {};


    constructor(private labels: Labels,
                private utilTranslations: UtilTranslations,
                private messages: Messages) {}

    
    public isValid = (entry: any) => !isEmpty(entry);

    public isEditing = (entry: any) => this.entryInEditing?.original === entry

    public isEditingAllowed = () => !this.entryInEditing && !this.newEntry;

    public getSubfieldLabel = (subfield: Subfield) => this.subfieldLabels[subfield.name];

    public getSubfieldDescription = (subfield: Subfield) => this.subfieldDescriptions[subfield.name];


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
        this.updateEntryLabels();
    }


    public getSubfields(entry: any): Array<Subfield> {
        
        return this.field.subfields?.filter(subfield => {
            return Field.InputType.SUBFIELD_INPUT_TYPES.includes(subfield.inputType)
                && this.isConditionFulfilled(subfield, entry);
        });
    }


    private isConditionFulfilled(subfield: Subfield, entry: any): boolean {

        if (!subfield.condition) return true;

        const data: any = entry[subfield.condition.subfieldName];
        return data !== undefined
            ? isArray(subfield.condition.values)
                ? isArray(data)
                    ? intersect(data)(subfield.condition.values).length > 0
                    : subfield.condition.values.includes(data)
                : data === subfield.condition.values
            : false;
    }


    public createNewEntry() {

    	this.newEntry = {};
    }


    public cancelNewEntry() {

        this.newEntry = undefined;
    }


    public removeEntryAtIndex(entryIndex: number) {

        this.resource[this.field.name].splice(entryIndex, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public saveEntry(entry: any) {

        const cleanedUpEntry: any = this.cleanUpEntry(entry);

        try {
            this.assertSubfieldsDataIsCorrect(cleanedUpEntry);
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

    	if (this.newEntry === entry) {
            if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
    		this.resource[this.field.name].push(cleanedUpEntry);
            this.newEntry = undefined;
    	} else {
            const index: number = this.resource[this.field.name].indexOf(this.entryInEditing.original);
            this.resource[this.field.name].splice(index, 1, cleanedUpEntry);
            this.stopEditing();
        }

        this.updateEntryLabels();
    }


    public startEditing(entry: any) {

        this.entryInEditing = { original: entry, clone: clone(entry) };
    }


    private stopEditing() {

        this.entryInEditing = undefined;
    }


    private cleanUpEntry(entry: any): any {

        return Object.keys(entry).reduce((result, subfieldName) => {
            const subfield: Subfield = this.field.subfields.find(on(Named.NAME, is(subfieldName)));
            if (this.isConditionFulfilled(subfield, entry)) result[subfieldName] = entry[subfieldName];
            return result;
        }, {});
    }


    private assertSubfieldsDataIsCorrect(entry: any) {

        this.getSubfields(entry).forEach(subfield => {
            const subfieldData: any = entry[subfield.name];
            if (subfieldData && !this.validateSubfieldData(subfieldData, subfield.inputType)) {
                throw [this.getValidationErrorMessage(subfield.inputType), '', this.labels.get(subfield)];
            }
        });
    }


    private validateSubfieldData(subfieldData: any, inputType: Field.InputType): boolean {

        switch (inputType) {
            case Field.InputType.INT:
                return validateInt(subfieldData);
            case Field.InputType.UNSIGNEDINT:
                return validateUnsignedInt(subfieldData);
            case Field.InputType.FLOAT:
                return validateFloat(subfieldData);
            case Field.InputType.UNSIGNEDFLOAT:
                return validateUnsignedFloat(subfieldData);
            case Field.InputType.URL:
                return validateUrl(subfieldData);
            default:
                return true;
        }
    }


    private getValidationErrorMessage(inputType: Field.InputType): string {

        switch (inputType) {
            case Field.InputType.INT:
            case Field.InputType.UNSIGNEDINT:
            case Field.InputType.FLOAT:
            case Field.InputType.UNSIGNEDFLOAT:
                return M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE;
            case Field.InputType.URL:
                return M.DOCEDIT_VALIDATION_ERROR_INVALID_URL;
        }
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
