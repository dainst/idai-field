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


    public showDeleteImagesOption() {

        return this.relatedImagesCount > 0;
    }

    // TODO handle imported catalogs
    public showDeleteImagesOptionForResourceSingular() {

        return this.descendantsCount === 0 && this.relatedImagesCount === 1;
    }
    public showDeleteImagesOptionForResourcePlural() {

        return this.descendantsCount === 0 && this.relatedImagesCount > 1;
    }
    public showDeleteImagesOptionForResourceWithDescendantsSingular() {

        return this.descendantsCount > 0 && this.relatedImagesCount === 1;
    }
    public showDeleteImagesOptionForResourceWithDescendantsPlural() {

        return this.descendantsCount > 0 && this.relatedImagesCount > 1;
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDeletion() {

        if (this.confirmDeletionIdentifier !== this.document.resource.identifier) return;
        this.activeModal.close(this.deleteRelatedImages);
    }
}
