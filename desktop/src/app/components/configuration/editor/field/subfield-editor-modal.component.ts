import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, is, isArray, on, subsetOf } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, I18N, Labels, Named, Subfield, Condition,
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
    condition?: Condition;
}


@Component({
    templateUrl: './subfield-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
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
        Promise<void>;

    public data: SubfieldEditorData;
    

    constructor(private activeModal: NgbActiveModal,
                private messages: Messages,
                private menus: Menus,
                private labels: Labels) {}

    
    public getInputType = () => this.data.inputType;

    public setInputType = (inputType: Field.InputType) => this.data.inputType = inputType;

    public cancel = () => this.activeModal.dismiss();

    public isI18nCompatible = () => Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType());

    public isValuelistSectionVisible = () => Field.InputType.VALUELIST_INPUT_TYPES.includes(this.getInputType());

    public getSubfieldLabel = (subfield: Subfield) => this.labels.get(subfield);


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
}
