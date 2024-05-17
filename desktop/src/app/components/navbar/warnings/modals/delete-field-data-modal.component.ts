import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Datastore, Document, Labels, WarningType } from 'idai-field-core';
import { DeletionInProgressModalComponent } from '../../../widgets/deletion-in-progress-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';


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
                private modalService: NgbModal,
                private datastore: Datastore,
                private labels: Labels) {}


    public getCategoryLabel = () => this.labels.get(this.category);

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public getFieldLabelHTML(): string {

        return this.fieldLabel
            ? '<span><b>' + this.fieldLabel + '</b> (<code>' + this.fieldName + '</code>)</span>'
            : '<code>' + this.fieldName + '</code>';
    }


    public isDeletionAllowed(): boolean {

        return !this.deleteAll
            || this.fieldName === this.confirmFieldName
            || (this.fieldLabel && this.fieldLabel === this.confirmFieldName);
    }


    public async performDeletion() {

        if (!this.isDeletionAllowed()) return;

        const deletionInProgressModal: NgbModalRef = this.openDeletionInProgressModal();

        await AngularUtility.refresh();
        
        if (this.deleteAll) {
            await this.deleteMultiple();
        } else {
            await this.deleteSingle();
        }

        deletionInProgressModal.close();
        this.activeModal.close();
    }


    private openDeletionInProgressModal(): NgbModalRef {

        const deletionInProgressModalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        deletionInProgressModalRef.componentInstance.mode = 'field';
        deletionInProgressModalRef.componentInstance.multiple = this.deleteAll;
        
        return deletionInProgressModalRef;
    }


    private async deleteSingle() {

        delete this.document.resource[this.fieldName];
        await this.datastore.update(this.document);
    }


    private async deleteMultiple() {

        const documents = (await this.datastore.find({
            categories: [this.category.name],
            constraints: { [this.warningType + ':contain']: this.fieldName }
        }, { includeResourcesWithoutValidParent: true })).documents;

        documents.forEach(document => {
            delete document.resource[this.fieldName];
        });

        await this.datastore.bulkUpdate(documents);
    }
}
