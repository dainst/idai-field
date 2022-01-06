import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { flatMap, to } from 'tsfun';
import { Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../index/configuration-index';
import { ValuelistUsage } from '../index/valuelist-usage-index';


@Component({
    templateUrl: './delete-valuelist-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class DeleteValuelistModalComponent {

    public valuelist: Valuelist;
    public configurationIndex: ConfigurationIndex;

    public confirmDeletionValuelistId: string;


    constructor(public activeModal: NgbActiveModal) {}


    public confirmDeletion = () => this.checkConfirmDeletionValuelistId() && this.activeModal.close();
    
    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public getNumberOfUsingFields(): number {

        const usage: Array<ValuelistUsage>|undefined = ConfigurationIndex.getValuelistUsage(
            this.configurationIndex, this.valuelist.id
        );

        return usage ? flatMap(usage, to('fields')).length : 0;
    }


    public checkConfirmDeletionValuelistId(): boolean {
        
        return this.confirmDeletionValuelistId === this.valuelist.id;
    }
}
