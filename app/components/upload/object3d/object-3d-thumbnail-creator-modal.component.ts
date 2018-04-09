import {Component, ElementRef} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiField3DDocument} from '../../../core/model/idai-field-3d-document';


@Component({
    moduleId: module.id,
    templateUrl: './object-3d-thumbnail-creator-modal.html'
})

/**
 * @author Thomas Kleinke
 */
export class Object3DThumbnailCreatorModalComponent {

    public document: IdaiField3DDocument;


    constructor(private activeModal: NgbActiveModal,
                private element: ElementRef) {}


    public async createThumbnail() {

        const canvasElement: HTMLCanvasElement = this.element.nativeElement.getElementsByTagName('canvas')[0];

        const blob: Blob|null = await this.getAsBlob(canvasElement);

        this.activeModal.close({
            blob: blob,
            width: canvasElement.width,
            height: canvasElement.height
        });
    }


    private async getAsBlob(canvasElement: HTMLCanvasElement): Promise<Blob|null> {

        return new Promise<Blob|null>(resolve => {
            canvasElement.toBlob(blob => resolve(blob), 'image/jpeg', 0.6);
        });
    }
}