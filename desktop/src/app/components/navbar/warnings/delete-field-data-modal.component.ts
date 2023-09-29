import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Datastore, Document } from 'idai-field-core';


@Component({
    templateUrl: './delete-field-data-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class DeleteFieldDataModalComponent {

    public document: Document;
    public fieldName: string;
    public fieldLabel: string|undefined;
    public category: CategoryForm;

    public confirmFieldName: string;


    constructor(public activeModal: NgbActiveModal,
                private datastore: Datastore) {}

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public checkConfirmFieldName(): boolean {

        return this.fieldName === this.confirmFieldName
            || (this.fieldLabel && this.fieldLabel === this.confirmFieldName);
    }


    public async performDeletion() {

        if (!this.checkConfirmFieldName()) return;
        
        await this.deleteFieldData();
        this.activeModal.close();
    }


    private async deleteFieldData() {

        delete this.document.resource[this.fieldName];
        await this.datastore.update(this.document);
    }
}
