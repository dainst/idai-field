import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {isNot, undefinedOrEmpty} from 'tsfun';
import {Document} from 'idai-components-2';
import {ProjectCategories} from '../../../core/configuration/project-categories';
import {ImageRelations} from '../../../core/model/relation-constants';


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
    public isRecordedInResourcesCount: number; // TODO rename to descendantsCount
    public confirmDeletionIdentifier: string;

    public relatedImagesCount: number;
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


    public showDeleteImagesOptionForTypeCatalog() {

        if (this.document.resource.category !== 'TypeCatalog') return false;
        if (this.document.project !== undefined) return false;

        return this.relatedImagesCount > 0;
    }


    public showDeleteImagesOptionForType() {

        if (this.document.resource.category !== 'Type') return false;
        if (this.document.project !== undefined) return false; // TODO this should rather should throw an error

        return this.relatedImagesCount > 0;
    }


    public showDeleteImagesOptionForResources() {

        if (ProjectCategories.getTypeCategoryNames().includes(this.document.resource.category)) return false;

        return this.relatedImagesCount > 0;
    }


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
