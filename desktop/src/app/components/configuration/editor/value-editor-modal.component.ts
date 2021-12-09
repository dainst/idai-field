import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, isEmpty } from 'tsfun';
import { ValuelistValue } from 'idai-field-core';


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


    protected changeMessage = this.i18n({
        id: 'docedit.saveModal.valuelistChanged', value: 'Die Werteliste wurde geändert.'
    });


    constructor(public activeModal: NgbActiveModal,
                private i18n: I18n) {
    }
   

    public initialize() {

        this.clonedValue = clone(this.value);
        if (!this.clonedValue.label) this.clonedValue.label = {};
    }


    public closeModal() {

        if (isEmpty(this.clonedValue.label)) delete this.clonedValue.label;
        this.activeModal.close(this.clonedValue);
    }
}
