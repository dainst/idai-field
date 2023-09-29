import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Datastore, Document, WarningType } from 'idai-field-core';


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
    public warningType: WarningType;

    public deleteAll: boolean;
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
        
        if (this.deleteAll) {
            await this.deleteMultiple();
        } else {
            await this.deleteSingle();
        }
        this.activeModal.close();
    }


    private async deleteSingle() {

        delete this.document.resource[this.fieldName];
        await this.datastore.update(this.document);
    }


    private async deleteMultiple() {

        const documents = (await this.datastore.find({
            categories: [this.category.name],
            constraints: { [this.warningType + ':contain']: this.fieldName }
        })).documents;

        documents.forEach(document => {
            delete document.resource[this.fieldName];
        });

        await this.datastore.bulkUpdate(documents);
    }
}
