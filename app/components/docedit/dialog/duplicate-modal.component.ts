import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'duplicate-modal',
    moduleId: module.id,
    templateUrl: './duplicate-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class DuplicateModalComponent {

    public numberOfDuplicates: number|undefined;

    public readonly minNumberOfDuplicates: number = 1;
    public readonly maxNumberOfDuplicates: number = 1000;


    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDuplication() {

        if (!this.validateNumberOfDuplicates()) return;

        this.activeModal.close(this.numberOfDuplicates);
    }


    public validateNumberOfDuplicates(): boolean {

        return this.numberOfDuplicates !== undefined
            && this.numberOfDuplicates >= this.minNumberOfDuplicates
            && this.numberOfDuplicates <= this.maxNumberOfDuplicates;
    }
}