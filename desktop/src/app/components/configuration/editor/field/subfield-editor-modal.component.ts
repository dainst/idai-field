import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, is, isArray, on, subsetOf } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, I18N, Labels, Named, Subfield, SubfieldCondition,
    Valuelist } from 'idai-field-core';
import { InputType } from '../../configuration-util';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';


export type SubfieldEditorData = {
    label: I18N.String;
    description: I18N.String;
    inputType: Field.InputType;
    references: string[];
    valuelist: Valuelist;
    condition?: SubfieldCondition;
}


@Component({
    templateUrl: './subfield-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class SubfieldEditorModalComponent {

    public subfield: Subfield;
    public parentField: Field;
    public category: CategoryForm;
    public references: string[];
    public new: boolean;
    public subfields: Array<Subfield>;
    public availableInputTypes: Array<InputType>;
    public projectLanguages: string[];
    public configurationDocument: ConfigurationDocument;
    public clonedConfigurationDocument: ConfigurationDocument;
    public applyChanges: (configurationDocument: ConfigurationDocument, reindexConfiguration?: boolean) =>
        Promise<ConfigurationDocument>;

    public data: SubfieldEditorData;
    

    constructor(private activeModal: NgbActiveModal,
                private messages: Messages,
                private menus: Menus,
                private labels: Labels) {}

    
    public getInputType = () => this.data.inputType;

    public setInputType = (inputType: Field.InputType) => this.data.inputType = inputType;

    public cancel = () => this.activeModal.dismiss();

    public isI18nCompatible = () => Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType());

    public isConditionSectionVisible = () => this.getConditionSubfields().length > 0;

    public isValuelistSectionVisible = () => Field.InputType.VALUELIST_INPUT_TYPES.includes(this.getInputType());

    public getSubfieldLabel = (subfield: Subfield) => this.labels.get(subfield);

    public getValueLabel = (valueId: string) => this.labels.getValueLabel(this.getConditionValuelist(), valueId);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.CONFIGURATION_SUBFIELD_EDIT) {
            this.activeModal.dismiss();
        }
    }


    public initialize() {

        this.data = {
            label: clone(this.subfield.label) ?? {},
            description: clone(this.subfield.description) ?? {},
            inputType: this.subfield.inputType,
            references: clone(this.references) ?? [],
            valuelist: clone(this.subfield.valuelist),
            condition: clone(this.subfield.condition) ?? { subfieldName: '', values: undefined }
        };
    }


    public confirmChanges() {

        if (!this.data.valuelist && this.isValuelistSectionVisible()) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_VALUELIST]);
        }

        try {
            this.assertChangesDoNotViolateConditionalSubfields();
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        this.activeModal.close(this.data);
    }


    public getConditionSubfields(): Array<Subfield> {

        if (!this.subfields) return [];

        return this.subfields.filter(subfield => {
            return subfield.name !== this.subfield.name
                && (subfield.inputType === Field.InputType.BOOLEAN || subfield.valuelist)
                && this.isValidConditionSubfield(this.subfield, subfield);
        });
    }


    private isValidConditionSubfield(subfield: Subfield, conditionSubfieldToCheck: Subfield): boolean {

        do {
            conditionSubfieldToCheck = conditionSubfieldToCheck.condition
                ? this.subfields.find(s => s.name === conditionSubfieldToCheck.condition.subfieldName)
                : undefined;
            if (conditionSubfieldToCheck === subfield) return false;
        } while (conditionSubfieldToCheck);

        return true;
    }


    public resetConditionValues() {

        if (this.getConditionType() === 'valuelist') {
            this.data.condition.values = [];
        } else {
            this.data.condition.values = true;
        }
    }


    public getConditionType(): 'valuelist'|'boolean' {

        return this.getConditionSubfield()?.inputType === 'boolean'
            ? 'boolean'
            : 'valuelist';
    }


    public getConditionValues(): string[] {

        return this.labels.orderKeysByLabels(this.getConditionValuelist());
    }


    public setConditionValue(value: boolean) {

        this.data.condition.values = value;
    }


    public toggleConditionValue(value: string) {

        const values: string[] = this.data.condition.values as string[];
        if ((values).includes(value)) {
            this.data.condition.values = values.filter(v => v !== value);
        } else {
            values.push(value);
        }
    }


    public isSelectedConditionValue(value: string): boolean {

        return isArray(this.data.condition.values) && this.data.condition.values.includes(value);
    }


    private getConditionSubfield(): Subfield {

        const subfieldName: string = this.data.condition?.subfieldName;
        return subfieldName
            ? this.getSubfield(subfieldName)
            : undefined;
    }


    private assertChangesDoNotViolateConditionalSubfields() {

        if (!this.subfields?.length) return;

        for (let subfield of this.subfields.filter(subfield => {
            return subfield.condition?.subfieldName === this.subfield.name;
        })) {
            if ((subfield.condition.values === true || subfield.condition.values === false)
                && this.data.inputType !== Field.InputType.BOOLEAN) {
                    throw [M.CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_INPUT_TYPE, this.labels.get(subfield)];
            } else if (isArray(subfield.condition.values)
                && (!Field.InputType.VALUELIST_INPUT_TYPES.includes(this.data.inputType)
                        || !subsetOf(Object.keys(this.data.valuelist.values), subfield.condition.values))) {
                    throw [M.CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_VALUELISTS, this.labels.get(subfield)];
            }
        }
    }


    private getSubfield(name: string): Subfield {

        return this.subfields.find(on(Named.NAME, is(name)));
    }


    private getConditionValuelist(): Valuelist {

        return this.getConditionSubfield()?.valuelist;
    }
}
