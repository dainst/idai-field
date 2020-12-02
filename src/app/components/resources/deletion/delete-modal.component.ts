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
    public isRecordedInResourcesCount: number;
    public confirmDeletionIdentifier: string;

    public deleteRelatedImages: boolean;

    constructor(public activeModal: NgbActiveModal) {}

    public showDeleteMultipleResourcesWarningSingle = () =>
        this.isRecordedInResourcesCount === 1
        && !ProjectCategories.getTypeCategoryNames().includes(this.document.resource.category);

    public showDeleteMultipleResourcesWarningMultiple = () =>
        this.isRecordedInResourcesCount > 1
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

    public showDeleteImagesOptionForTypeCatalog = () =>
        this.document.resource.category === 'TypeCatalog'
        && this.document.project === undefined;

    public showDeleteImagesOptionForType = () =>
        this.document.resource.category === 'Type'
        && this.document.project === undefined;

    public showDeleteImagesOptionForResources = () =>
        this.document.resource.category !== 'Type'
        && this.document.resource.category !== 'TypeCatalog';

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
