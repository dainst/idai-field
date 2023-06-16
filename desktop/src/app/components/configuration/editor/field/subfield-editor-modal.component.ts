import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, is, isArray, on } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, I18N, Labels, Named, Subfield, SubfieldCondition,
    Valuelist } from 'idai-field-core';
import { InputType } from '../../configuration-util';
import { ApplyChangesResult } from '../../configuration.component';
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
        Promise<ApplyChangesResult>;

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

        this.activeModal.close(this.data);
    }


    public getConditionSubfields(): Array<Subfield> {

        if (!this.subfields) return [];

        return this.subfields.filter(subfield => {
            return subfield.name !== this.subfield.name
                && !subfield.condition
                && (subfield.inputType === Field.InputType.BOOLEAN || subfield.valuelist);
        });
    }


    public getConditionValues(): string[] {

        return this.labels.orderKeysByLabels(this.getConditionValuelist());
    }


    public toggleConditionValue(value: string) {

        if (this.data.condition.values === undefined) this.data.condition.values = [];
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


    private getConditionValuelist(): Valuelist {

        const subfieldName: string = this.data.condition?.subfieldName;
        if (!subfieldName) return undefined;

        return this.subfields.find(on(Named.NAME, is(subfieldName)))?.valuelist;
    }
}
