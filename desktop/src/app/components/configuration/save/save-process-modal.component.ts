import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './save-process-modal.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class SaveProcessModalComponent {
    
    constructor(public activeModal: NgbActiveModal) {}
}
