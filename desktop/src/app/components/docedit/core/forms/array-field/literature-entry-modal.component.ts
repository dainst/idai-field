import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Literature } from 'idai-field-core';
import { Menus } from '../../../../../services/menus';
import { MenuContext } from '../../../../../services/menu-context';



@Component({
    templateUrl: './literature-entry-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class LiteratureEntryModalComponent {

    public entry: Literature;
    public isNew: boolean;


    constructor(private activeModal: NgbActiveModal,
                private menus: Menus) {}


    public cancel = () => this.activeModal.dismiss();


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss();
        }
    }


    public async initialize() {

        if (this.isNew) this.entry = { quotation: '' };
    }


    public validate(): boolean {

        return this.entry.quotation.length > 0;
    }


    public confirm() {

        if (!this.validate()) return;

        this.cleanUp();
        this.activeModal.close(this.entry);
    }


    private cleanUp() {

        if (!this.entry.zenonId) delete this.entry.zenonId;
        if (!this.entry.doi) delete this.entry.doi;
        if (!this.entry.page) delete this.entry.page;
        if (!this.entry.figure) delete this.entry.figure;
    }
}
