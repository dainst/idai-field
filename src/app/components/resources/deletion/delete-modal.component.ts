import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2';
import {ProjectCategories} from '../../../core/configuration/project-categories';


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
    public descendantsCount: number;
    public confirmDeletionIdentifier: string;

    public relatedImagesCount: number;
    public deleteRelatedImages: boolean;

    constructor(public activeModal: NgbActiveModal) {}

    public showDeleteMultipleResourcesWarningSingle = () =>
        this.descendantsCount === 1
        && !ProjectCategories.getTypeCategoryNames().includes(this.document.resource.category);

    public showDeleteMultipleResourcesWarningMultiple = () =>
        this.descendantsCount > 1
        && !ProjectCategories.getTypeCategoryNames().includes(this.document.resource.category);

    public showImportedCatalogAssociationsMsg = () =>
        this.document.resource.category === 'TypeCatalog'
        && this.document.project !== undefined;

    public showOwnedCatalogAssociationsMsg = () =>
        this.document.resource.category === 'TypeCatalog'
        && this.document.project === undefined;

    public showOwnedTypeAssociationsMsg = () =>
        this.document.resource.category === 'Type'
        && this.document.project === undefined;

    public showDeleteImagesOption = () =>
        this.document.project === undefined
        && this.relatedImagesCount > 0;

    public showDeleteImagesOptionForResourceSingular = () =>
        this.document.project === undefined
        && this.descendantsCount === 0
        && this.relatedImagesCount === 1;

    public showDeleteImagesOptionForResourcePlural = () =>
        this.document.project === undefined
        && this.descendantsCount === 0
        && this.relatedImagesCount > 1;

    public showDeleteImagesOptionForResourceWithDescendantsSingular = () =>
        this.document.project === undefined
        && this.descendantsCount > 0
        && this.relatedImagesCount === 1;

    public showDeleteImagesOptionForResourceWithDescendantsPlural = () =>
        this.document.project === undefined
        && this.descendantsCount > 0
        && this.relatedImagesCount > 1;


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDeletion() {

        if (this.confirmDeletionIdentifier !== this.document.resource.identifier) return;
        this.activeModal.close(this.deleteRelatedImages);
    }
}
