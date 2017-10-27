import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration';

@Component({
    selector: 'type-picker-modal',
    moduleId: module.id,
    templateUrl: './image-type-picker-modal.html'
})

/**
 * @author Thomas Kleinke
 */
export class ImageTypePickerModalComponent {

    public fileCount: number;

    private imageType: IdaiType;

    constructor(
        public activeModal: NgbActiveModal,
        projectConfiguration: ProjectConfiguration
    ) {
        this.imageType = projectConfiguration.getTypesTree()['Image'];
    }
}