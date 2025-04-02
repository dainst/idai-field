import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, RelationsManager, Relation, Resource } from 'idai-field-core';


@Component({
    templateUrl: './workflow-relations-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowRelationsModalComponent {

    public workflowStep: Document;
    public relationDefinition: Relation;
    public mandatory: boolean;

    public clonedWorkflowStep: Document;


    constructor(private activeModal: NgbActiveModal,
                private relationsManager: RelationsManager) {}

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.cancel();
    }


    public initialize() {

        this.clonedWorkflowStep = Document.clone(this.workflowStep);
    }


    public validate(): boolean {

        return !this.mandatory
            || Resource.hasRelations(this.clonedWorkflowStep.resource, this.relationDefinition.name);
    }


    public async save() {

        if (!this.validate()) return;

        await this.relationsManager.update(this.clonedWorkflowStep, Document.clone(this.workflowStep));
        this.activeModal.close();
    }
}
