import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, FieldDocument, Document, RelationsManager, Relation, Resource, Datastore, Labels,
    ProjectConfiguration } from 'idai-field-core';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { DoceditComponent } from '../../../docedit/docedit.component';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';


@Component({
    templateUrl: './workflow-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowEditorModalComponent {

    public document: FieldDocument;
    public workflowSteps: Array<Document>;


    constructor(private activeModal: NgbActiveModal,
                private menus: Menus,
                private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private datastore: Datastore,
                private messages: Messages,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration) {}


    public getCategoryLabel = (workflowStep: Document) =>
        this.labels.get(this.projectConfiguration.getCategory(workflowStep));
    
    public getShortDescriptionLabel = (workflowStep: Document) =>
        Resource.getShortDescriptionLabel(workflowStep.resource, this.labels, this.projectConfiguration);
    
    public cancel = () => this.activeModal.close();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.WORKFLOW_EDITOR) {
            this.cancel();
        }
    }


    public async initialize() {

        await this.updateWorkflowSteps();
    }


    public async createWorkflowStep(category: CategoryForm) {

        const newWorkflowStep: Document = await this.openEditorModal(
            WorkflowEditorModalComponent.buildWorkflowStepDocument(category)
        );
        if (!newWorkflowStep) return;

        await this.addRelation(newWorkflowStep);
        await this.updateWorkflowSteps();
    }


    /**
     * @returns edited document if changes have been saved, undefined if the modal has been canceled
     */
    private async openEditorModal(document: Document): Promise<Document|undefined> {
    
        this.menus.setContext(MenuContext.DOCEDIT);

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false });
        doceditRef.componentInstance.setDocument(document);

        try {
            return (await doceditRef.result).document;
        } catch(_) {
            // Modal has been canceled
            return undefined;
        } finally {
            this.menus.setContext(MenuContext.WORKFLOW_EDITOR);
        }
    }


    private async addRelation(workflowStep: Document) {

        const oldVersion: Document = Document.clone(workflowStep);

        const resource: Resource = this.document.resource;
        if (!resource.relations) resource.relations = {};
        if (!resource.relations[Relation.HAS_WORKFLOW_STEP]) resource.relations[Relation.HAS_WORKFLOW_STEP] = [];
        resource.relations[Relation.HAS_WORKFLOW_STEP].push(workflowStep.resource.id);

        try {
            await this.relationsManager.update(this.document, oldVersion);
        } catch (err) {
            console.error(err);
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
        }
    }


    private async updateWorkflowSteps() {

        const targetIds: string[] = this.document.resource.relations?.[Relation.HAS_WORKFLOW_STEP] ?? [];
        this.workflowSteps = await this.datastore.getMultiple(targetIds);
    }


    private static buildWorkflowStepDocument(category: CategoryForm): Document {

        return <Document> {
            resource: {
                relations: {},
                category: category.name
            }
        };
    }
}
