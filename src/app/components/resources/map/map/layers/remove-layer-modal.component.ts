import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ImageDocument, FieldDocument} from 'idai-components-2';
import {LayerUtility} from './layer-utility';

@Component({
    selector: 'remove-layer-modal',
    templateUrl: './remove-layer-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})

/**
 * @author Thomas Kleinke
 */
export class RemoveLayerModalComponent {

    public layer: ImageDocument;
    public document: FieldDocument;

    
    constructor(public activeModal: NgbActiveModal) {}


    public getLayerLabel = (layer: ImageDocument) => LayerUtility.getLayerLabel(layer);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
