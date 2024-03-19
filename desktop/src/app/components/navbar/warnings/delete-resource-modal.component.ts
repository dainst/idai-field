import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Document, RelationsManager } from 'idai-field-core';


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
    
    public deleteAll: boolean;
    public confirmCategoryName: string;


    constructor(public activeModal: NgbActiveModal,
                private datastore: Datastore,
                private relationsManager: RelationsManager) {}


    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public isDeletionAllowed(): boolean {

        return !this.deleteAll || this.confirmCategoryName === this.document.resource.category;
    }


    public async performDeletion() {

        if (!this.isDeletionAllowed()) return;
        
        if (this.deleteAll) {
            await this.deleteMultiple();
        } else {
            await this.deleteSingle();
        }

        this.activeModal.close();
    }


    private async deleteSingle() {

        await this.relationsManager.remove(this.document);
    }


    private async deleteMultiple() {

        const documents = (await this.datastore.find({ categories: ['UNCONFIGURED'] })).documents
            .filter(document => document.resource.category === this.document.resource.category);
        
        for (let document of documents) {
            await this.relationsManager.remove(document);
        }
    }
}
