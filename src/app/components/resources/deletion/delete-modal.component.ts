import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2';


@Component({
    selector: 'delete-modal',
    templateUrl: './delete-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class DeleteModalComponent {

    public document: Document;
    public isRecordedInResourcesCount: number;
    public confirmDeletionIdentifier: string;

    public deleteRelatedImages: boolean;

    constructor(public activeModal: NgbActiveModal) {}

    public showDeleteMultipleResourcesWarningSingle = () =>
        this.isRecordedInResourcesCount === 1
        && this.document.resource.category !== 'TypeCatalog';

    public showDeleteMultipleResourcesWarningMultiple = () =>
        this.isRecordedInResourcesCount > 1
        && this.document.resource.category !== 'TypeCatalog';

    public showImportedCatalogAssociationsMsg = () =>
        this.document.resource.category === 'TypeCatalog'
        && this.document.project !== undefined;

    public showOwnedCatalogAssociationsMsg = () =>
        this.document.resource.category === 'TypeCatalog'
        && this.document.project === undefined;

    public showDeleteCatalogImagesOption = () =>
        this.document.resource.category === 'TypeCatalog'
        && this.document.project === undefined;

    public setDocument = (document: Document) => this.document = document;

    public setCount = (count: number) => this.isRecordedInResourcesCount = count;

    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDeletion() {

        if (this.confirmDeletionIdentifier !== this.document.resource.identifier) return;
        this.activeModal.close(this.deleteRelatedImages);
    }
}
