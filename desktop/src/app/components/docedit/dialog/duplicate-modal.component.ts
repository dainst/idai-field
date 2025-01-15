import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'duplicate-modal',
    templateUrl: './duplicate-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})

/**
 * @author Thomas Kleinke
 */
export class DuplicateModalComponent {

    public maxNumberOfDuplicates: number;

    public numberOfDuplicates: number|undefined;
    public newDocument: boolean;

    private readonly minNumberOfDuplicates: number = 1;


    constructor(public activeModal: NgbActiveModal) {}


    public initialize(newDocument: boolean) {

        this.newDocument = newDocument;
        this.numberOfDuplicates = this.getMinNumberOfDuplicates();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public getMinNumberOfDuplicates(): number {

        return this.newDocument
            ? this.minNumberOfDuplicates + 1
            : this.minNumberOfDuplicates;
    }


    public getMaxNumberOfDuplicates(): number {

        return this.maxNumberOfDuplicates;
    }


    public confirmDuplication() {

        if (!this.validateNumberOfDuplicates()) return;

        this.activeModal.close(
            this.newDocument
                ? (this.numberOfDuplicates as number) - 1
                : this.numberOfDuplicates
        );
    }


    public validateNumberOfDuplicates(): boolean {

        return this.numberOfDuplicates !== undefined
            && this.numberOfDuplicates >= this.getMinNumberOfDuplicates()
            && this.numberOfDuplicates <= this.getMaxNumberOfDuplicates();
    }
}
