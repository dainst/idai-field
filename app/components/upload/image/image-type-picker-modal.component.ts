import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Document, ProjectConfiguration, IdaiType} from 'idai-components-2';

@Component({
    selector: 'type-picker-modal',
    moduleId: module.id,
    templateUrl: './image-type-picker-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})

/**
 * @author Thomas Kleinke
 */
export class ImageTypePickerModalComponent {

    public fileCount: number;
    public depictsRelationTarget: Document;
    public imageType: IdaiType;


    constructor(public activeModal: NgbActiveModal,
                projectConfiguration: ProjectConfiguration) {

        this.imageType = projectConfiguration.getTypesTree()['Image'];
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}