import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../../../../services/menus';
import { FieldDocument, Document } from 'idai-field-core';
import { MenuContext } from '../../../../../services/menu-context';
import { WorkflowStepLinkModalComponent } from './workflow-step-link-modal.component';
import { AngularUtility } from '../../../../../angular/angular-utility';


@Component({
    selector: 'workflow-step-link-button',
    templateUrl: './workflow-step-link-button.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowStepLinkButtonComponent {

    @Input() baseDocuments: Array<FieldDocument>;

    @Output() onWorkflowStepSelected: EventEmitter<Document> = new EventEmitter<Document>();


    constructor(private menus: Menus,
                private modalService: NgbModal) {}


    public async openModal() {

        try {
            this.menus.setContext(MenuContext.MODAL);

            const modalRef: NgbModalRef = this.modalService.open(
                WorkflowStepLinkModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.baseDocuments = this.baseDocuments;
            await modalRef.componentInstance.initialize();
            AngularUtility.blurActiveElement();
            const selectedWorkflowStep: Document = await modalRef.result;
            this.onWorkflowStepSelected.emit(selectedWorkflowStep);
        } catch (err) {
            if (err !== 'cancel') console.error(err);
        } finally {
            this.menus.setContext(MenuContext.WORKFLOW_EDITOR);
        }
    }
}
