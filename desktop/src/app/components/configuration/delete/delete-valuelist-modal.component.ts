import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { flatMap, to } from 'tsfun';
import { Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../services/configuration/index/configuration-index';
import { ValuelistUsage } from '../../../services/configuration/index/valuelist-usage-index';


@Component({
    templateUrl: './delete-valuelist-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DeleteValuelistModalComponent {

    public valuelist: Valuelist;

    public confirmDeletionValuelistId: string;


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex) {}


    public confirmDeletion = () => this.checkConfirmDeletionValuelistId() && this.activeModal.close();
    
    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public getNumberOfUsingFields(): number {

        const usage: Array<ValuelistUsage>|undefined = this.configurationIndex.getValuelistUsage(this.valuelist.id);

        return usage ? flatMap(usage, to('fields')).length : 0;
    }


    public checkConfirmDeletionValuelistId(): boolean {
        
        return this.confirmDeletionValuelistId === this.valuelist.id;
    }
}
