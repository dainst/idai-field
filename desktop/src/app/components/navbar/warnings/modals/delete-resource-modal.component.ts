import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Document, RelationsManager, WarningType } from 'idai-field-core';
import { DeletionInProgressModalComponent } from '../../../widgets/deletion-in-progress-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';


@Component({
    templateUrl: './delete-resource-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class DeleteResourceModalComponent {

    public document: Document;
    public warningType: WarningType;
    
    public deleteAll: boolean;
    public confirmValue: string;
    public countAffected: number;
    
    private affectedDocuments: Array<Document>;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private datastore: Datastore,
                private relationsManager: RelationsManager) {}


    public isMultipleSwitchAvailable = () => this.warningType === 'unconfiguredCategory';

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }

    
    public async initialize() {

        const foundDocuments: Array<Document> = (await this.datastore.find(
            { categories: ['UNCONFIGURED'] },
            { includeResourcesWithoutValidParent: true }
        )).documents;

        this.affectedDocuments = foundDocuments.filter(document => {
            return document.resource.category === this.document.resource.category;
        });

        this.countAffected = this.affectedDocuments.length;
    }


    public isDeletionAllowed(): boolean {

        if (this.deleteAll) {
            return this.confirmValue === this.document.resource.category;
        } else {
            return this.confirmValue === this.document.resource.identifier;
        }
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
        deletionInProgressModalRef.componentInstance.mode = 'resource';
        deletionInProgressModalRef.componentInstance.multiple = this.deleteAll;
        
        return deletionInProgressModalRef;
    }


    private async deleteSingle() {

        await this.relationsManager.remove(this.document);
    }


    private async deleteMultiple() {
        
        for (let document of this.affectedDocuments) {
            await this.relationsManager.remove(document);
        }
    }
}
