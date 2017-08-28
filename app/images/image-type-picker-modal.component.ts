import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfigLoader, IdaiType} from 'idai-components-2/configuration';

@Component({
    selector: 'type-picker-modal',
    moduleId: module.id,
    templateUrl: './image-type-picker-modal.html'
})

/**
 * @author Thomas Kleinke
 */
export class ImageTypePickerModalComponent {

    private imageType: IdaiType;

    constructor(public activeModal: NgbActiveModal, configLoader: ConfigLoader) {
        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.imageType = projectConfiguration.getTypesTree()['Image'];
        });
    }
}