import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Relation, ProcessDocument } from 'idai-field-core';


@Component({
    templateUrl: './delete-process-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DeleteProcessModalComponent {

    public process: ProcessDocument;


    constructor(public activeModal: NgbActiveModal) {}


    public getNumberOfLinkedResources = () => this.process.resource.relations
        ?.[Relation.Workflow.IS_CARRIED_OUT_ON]?.length;


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
