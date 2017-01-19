import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'link-modal',
    template: `
    <div class="modal-body">
        <p>Zu verknüpfende Ressource wählen:</p>
        <document-picker (documentSelected)="activeModal.close($event)"
                         [filterSet]="{ filters: [ { field: 'type', value: 'image', invert: true } ], type: 'and' }"></document-picker>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" (click)="activeModal.dismiss('dismissedByCancel')">Abbrechen</button>
    </div>
  `
})
export class LinkModalComponent {

    constructor(public activeModal: NgbActiveModal) {}

}