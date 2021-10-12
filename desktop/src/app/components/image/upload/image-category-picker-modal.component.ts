import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, ProjectConfiguration, CategoryForm, Labels } from 'idai-field-core';


@Component({
    selector: 'image-category-picker-modal',
    templateUrl: './image-category-picker-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ImageCategoryPickerModalComponent {

    public fileCount: number;
    public depictsRelationTarget: Document;
    public imageCategory: CategoryForm;


    constructor(public activeModal: NgbActiveModal,
                projectConfiguration: ProjectConfiguration,
                private labels: Labels) {

        this.imageCategory = projectConfiguration.getCategory('Image');
    }


    public getImageCategoryLabel = (category: CategoryForm) => this.labels.get(category);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
