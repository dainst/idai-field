import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-field-core';
import {Category} from 'idai-field-core';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';

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
                projectConfiguration: ProjectConfiguration) {

        this.imageCategory = projectConfiguration.getCategory('Image');
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
