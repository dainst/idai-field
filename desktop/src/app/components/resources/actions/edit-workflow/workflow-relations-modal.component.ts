import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, RelationsManager, Relation } from 'idai-field-core';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';


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

    public clonedWorkflowStep: Document;


    constructor(private activeModal: NgbActiveModal,
                private menus: Menus,
                private relationsManager: RelationsManager) {}


    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.MODAL) {
            this.cancel();
        }
    }


    public initialize() {

        this.clonedWorkflowStep = Document.clone(this.workflowStep);
    }


    public async save() {

        await this.relationsManager.update(this.clonedWorkflowStep, Document.clone(this.workflowStep));
        this.activeModal.close();
    }
}
