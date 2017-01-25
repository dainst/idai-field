import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ImageGridBuilder} from '../images/image-grid-builder';
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";

@Component({
    selector: 'image-picker',
    moduleId: module.id,
    templateUrl: './image-picker.html'
})
export class ImagePickerComponent {
    selectedImages: IdaiFieldImageDocument[] = [];
    constructor(public activeModal: NgbActiveModal) {}
}