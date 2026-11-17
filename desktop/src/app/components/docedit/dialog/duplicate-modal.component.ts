import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MIN_NUMBER_OF_DUPLICATES } from '../duplication-util';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';


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


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public initialize(newDocument: boolean) {

        this.newDocument = newDocument;
        this.numberOfDuplicates = this.getMinNumberOfDuplicates();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public getMinNumberOfDuplicates(): number {

        return this.newDocument
            ? MIN_NUMBER_OF_DUPLICATES + 1
            : MIN_NUMBER_OF_DUPLICATES;
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
