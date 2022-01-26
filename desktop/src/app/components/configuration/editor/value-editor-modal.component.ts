import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, isEmpty, not } from 'tsfun';
import { ValuelistValue } from 'idai-field-core';
import { validateReferences } from '../validation/validate-references';
import { Messages } from '../../messages/messages';


@Component({
    templateUrl: './value-editor-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class ValueEditorModalComponent {

    public value: ValuelistValue;
    public valueId: string
    public new: boolean;

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


    public confirmChanges() {

        this.clonedValue.references = this.clonedValue.references.filter(not(isEmpty));

        try {
            validateReferences(this.clonedValue.references);
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        if (isEmpty(this.clonedValue.label)) delete this.clonedValue.label;
        if (isEmpty(this.clonedValue.description)) delete this.clonedValue.description;
        if (isEmpty(this.clonedValue.references)) delete this.clonedValue.references;
        
        this.activeModal.close(this.clonedValue);
    }
}
