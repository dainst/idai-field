import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, isEmpty } from 'tsfun';
import { ValuelistValue } from 'idai-field-core';
import { Messages } from '../../messages/messages';
import { ConfigurationUtil } from '../configuration-util';


@Component({
    templateUrl: './value-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ValueEditorModalComponent {

    public value: ValuelistValue;
    public valueId: string
    public new: boolean;
    public projectLanguages: string[];

    public clonedValue: ValuelistValue;


    constructor(public activeModal: NgbActiveModal,
                private messages: Messages) {}

    
    public cancel = () => this.activeModal.dismiss();
   

    public initialize() {

        this.clonedValue = clone(this.value);
        if (!this.clonedValue.label) this.clonedValue.label = {};
        if (!this.clonedValue.description) this.clonedValue.description = {};
        if (!this.clonedValue.references) this.clonedValue.references = [];
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss();
    }


    public confirmChanges() {

        try {
            ConfigurationUtil.cleanUpAndValidateReferences(this.clonedValue);
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        if (isEmpty(this.clonedValue.label)) delete this.clonedValue.label;
        if (isEmpty(this.clonedValue.description)) delete this.clonedValue.description;
        
        this.activeModal.close(this.clonedValue);
    }
}
