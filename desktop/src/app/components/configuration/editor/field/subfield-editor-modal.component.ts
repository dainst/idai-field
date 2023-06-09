import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, I18N, Subfield, Valuelist } from 'idai-field-core';
import { InputType } from '../../configuration-util';
import { ApplyChangesResult } from '../../configuration.component';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';


export type SubfieldEditorData = {
    label: I18N.String;
    description: I18N.String;
    inputType: Field.InputType;
    references: string[];
    valuelist: Valuelist;
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
    public availableInputTypes: Array<InputType>;
    public projectLanguages: string[];
    public configurationDocument: ConfigurationDocument;
    public clonedConfigurationDocument: ConfigurationDocument;
    public applyChanges: (configurationDocument: ConfigurationDocument, reindexConfiguration?: boolean) =>
        Promise<ApplyChangesResult>;

    public data: SubfieldEditorData;
    

    constructor(private activeModal: NgbActiveModal,
                private messages: Messages) {}

    
    public getInputType = () => this.data.inputType;

    public setInputType = (inputType: Field.InputType) => this.data.inputType = inputType;

    public cancel = () => this.activeModal.dismiss();

    public isI18nCompatible = (): boolean => Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType());

    public isValuelistSectionVisible = () => Field.InputType.VALUELIST_INPUT_TYPES.includes(this.getInputType());

    
    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss();
    }


    public initialize() {

        this.data = {
            label: clone(this.subfield.label) ?? {},
            description: clone(this.subfield.description) ?? {},
            inputType: this.subfield.inputType,
            references: clone(this.references) ?? [],
            valuelist: clone(this.subfield.valuelist)
        };
    }


    public confirmChanges() {

        if (!this.data.valuelist && this.isValuelistSectionVisible()) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_VALUELIST]);
        }

        this.activeModal.close(this.data);
    }
}
