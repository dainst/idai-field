import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Relation, WorkflowStepDocument } from 'idai-field-core';


@Component({
    templateUrl: './delete-workflow-step-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DeleteWorkflowStepModalComponent {

    public workflowStep: WorkflowStepDocument;


    constructor(public activeModal: NgbActiveModal) {}


    public getNumberOfLinkedResources = () => this.workflowStep.resource.relations
        ?.[Relation.Workflow.IS_EXECUTED_ON]?.length;


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
