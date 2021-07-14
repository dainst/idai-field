import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, ProjectConfiguration, Category } from 'idai-field-core';
import {Labels} from '../../services/labels';


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
    public imageCategory: Category;


    constructor(public activeModal: NgbActiveModal,
                projectConfiguration: ProjectConfiguration,
                private labels: Labels) {

        this.imageCategory = projectConfiguration.getCategory('Image');
    }


    public getImageCategoryLabel = (category: Category) => this.labels.get(category);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
