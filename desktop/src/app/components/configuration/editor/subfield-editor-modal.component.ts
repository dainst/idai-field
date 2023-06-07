import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Field, I18N, Subfield } from 'idai-field-core';
import { InputType } from '../configuration-util';


export type SubfieldEditorData = {
    label: I18N.String;
    description: I18N.String;
    inputType: Field.InputType;
    references: string[];
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
    public references: string[];
    public new: boolean;
    public availableInputTypes: Array<InputType>;
    public projectLanguages: string[];

    public data: SubfieldEditorData;
    

    constructor(private activeModal: NgbActiveModal) {}

    
    public getInputType = () => this.data.inputType;

    public setInputType = (inputType: Field.InputType) => this.data.inputType = inputType;

    public cancel = () => this.activeModal.dismiss();

    public isI18nCompatible = (): boolean => Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType());

    
    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss();
    }


    public initialize() {

        this.data = {
            label: this.subfield.label ?? {},
            description: this.subfield.description ?? {},
            inputType: this.subfield.inputType ?? Field.InputType.INPUT,
            references: this.references ?? []
        };
    }


    public confirmChanges() {

        this.activeModal.close(this.data);
    }
}
