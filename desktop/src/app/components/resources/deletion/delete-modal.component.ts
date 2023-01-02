import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, Named, ProjectConfiguration } from 'idai-field-core';


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

    public documents: Array<Document>;
    public descendantsCount: number;
    public confirmDeletionIdentifier: string;

    public relatedImagesCount: number;
    public deleteRelatedImages: boolean = true;


    constructor(public activeModal: NgbActiveModal,
                public projectConfiguration: ProjectConfiguration) {}


    public showDeleteDescendantWarningSingle = () =>
        this.descendantsCount === 1
        && this.documents.length === 1
        && !this.projectConfiguration.getTypeManagementCategories()
            .map(Named.toName).includes(this.documents[0].resource.category);

    public showDeleteDescendantsWarningSingle = () =>
        this.descendantsCount > 1
        && this.documents.length === 1
        && !this.projectConfiguration.getTypeManagementCategories()
            .map(Named.toName).includes(this.documents[0].resource.category);

    public showDeleteDescendantWarningMultiple = () =>
        this.descendantsCount === 1
        && this.documents.length > 1
        && !this.projectConfiguration.getTypeManagementCategories()
            .map(Named.toName).includes(this.documents[0].resource.category);

    public showDeleteDescendantsWarningMultiple = () =>
        this.descendantsCount > 1
        && this.documents.length > 1
        && !this.projectConfiguration.getTypeManagementCategories()
            .map(Named.toName).includes(this.documents[0].resource.category);

    public showImportedCatalogAssociationsMsg = () =>
        this.documents[0].resource.category === 'TypeCatalog'
        && this.documents[0].project !== undefined;

    public showOwnedCatalogAssociationsMsg = () =>
        this.documents[0].resource.category === 'TypeCatalog'
        && this.documents[0].project === undefined;

    public showOwnedTypeAssociationsMsg = () =>
        this.documents[0].resource.category === 'Type'
        && this.documents[0].project === undefined;

    public showDeleteImagesOption = () =>
        this.documents[0].project === undefined
        && this.relatedImagesCount > 0;

    public showDeleteImagesOptionForResourceSingular = () =>
        this.documents[0].project === undefined
        && this.documents.length === 1
        && this.descendantsCount === 0
        && this.relatedImagesCount === 1;

    public showDeleteImagesOptionForResourcePlural = () =>
        this.documents[0].project === undefined
        && this.documents.length === 1
        && this.descendantsCount === 0
        && this.relatedImagesCount > 1;

    public showDeleteImagesOptionForResourceWithDescendantsSingular = () =>
        this.documents[0].project === undefined
        && this.documents.length === 1
        && this.descendantsCount > 0
        && this.relatedImagesCount === 1;

    public showDeleteImagesOptionForResourceWithDescendantsPlural = () =>
        this.documents[0].project === undefined
        && this.documents.length === 1
        && this.descendantsCount > 0
        && this.relatedImagesCount > 1;

    public showDeleteImagesOptionForResourcesSingular = () =>
        this.documents[0].project === undefined
        && this.documents.length > 1
        && this.descendantsCount === 0
        && this.relatedImagesCount === 1;

    public showDeleteImagesOptionForResourcesPlural = () =>
        this.documents[0].project === undefined
        && this.documents.length > 1
        && this.descendantsCount === 0
        && this.relatedImagesCount > 1;

    public showDeleteImagesOptionForResourcesWithDescendantsSingular = () =>
        this.documents[0].project === undefined
        && this.documents.length > 1
        && this.descendantsCount > 0
        && this.relatedImagesCount === 1;

    public showDeleteImagesOptionForResourcesWithDescendantsPlural = () =>
        this.documents[0].project === undefined
        && this.documents.length > 1
        && this.descendantsCount > 0
        && this.relatedImagesCount > 1;


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDeletion() {

        if (!this.checkConfirmDeletionIdentifier()) return;

        this.activeModal.close(this.showDeleteImagesOption() && this.deleteRelatedImages);
    }


    public checkConfirmDeletionIdentifier(): boolean {

        return this.documents.find(
            document => document.resource.identifier === this.confirmDeletionIdentifier
        ) !== undefined;
    }
}
