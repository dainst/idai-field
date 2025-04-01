import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { set } from 'tsfun';
import { CategoryForm, FieldDocument, Document, NewDocument, RelationsManager, Relation, Resource, Datastore, Labels,
    ProjectConfiguration, DateSpecification } from 'idai-field-core';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { DoceditComponent } from '../../../docedit/docedit.component';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';
import { AngularUtility } from '../../../../angular/angular-utility';
import { sortWorkflowSteps } from './sort-workflow-steps';
import { DeleteWorkflowStepModalComponent } from './delete/delete-workflow-step-modal.component';
import { getSystemTimezone } from '../../../../util/timezones';
import { Settings } from '../../../../services/settings/settings';


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

    public documents: Array<FieldDocument>;

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

        const newWorkflowStep: Document = await this.editWorkflowStep(
            WorkflowEditorModalComponent.buildWorkflowStepDocument(category) as Document
        );
        if (!newWorkflowStep) return;

        await this.linkWorkflowStep(newWorkflowStep);
    }


    public async linkWorkflowStep(workflowStep: Document) {

        await this.setRelation(workflowStep);
        await this.updateWorkflowSteps();
    }


    public async deleteWorkflowStep(workflowStep: Document) {

        this.menus.setContext(MenuContext.DOCEDIT);

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteWorkflowStepModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.workflowStep = workflowStep;

        try {
            await modalRef.result;
            await this.relationsManager.remove(workflowStep);
            await this.updateWorkflowSteps();
        } catch(err) {
            if (err !== 'cancel') console.error(err);
        } finally {
            AngularUtility.blurActiveElement();
            this.menus.setContext(MenuContext.WORKFLOW_EDITOR);
        }
    }


    /**
     * @returns edited document if changes have been saved, undefined if the modal has been canceled
     */
    public async editWorkflowStep(workflowStep: Document): Promise<Document|undefined> {
    
        this.menus.setContext(MenuContext.DOCEDIT);

        const modalRef: NgbModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.setDocument(workflowStep);

        try {
            return (await modalRef.result).document;
        } catch(err) {
            if (err !== 'cancel') console.error(err);
        } finally {
            AngularUtility.blurActiveElement();
            this.menus.setContext(MenuContext.WORKFLOW_EDITOR);
        }
    }


    public isResultsInRelationAvailable(workflowStep: Document): boolean {

        return this.projectConfiguration.getAllowedRelationRangeCategories(
            Relation.Workflow.RESULTS_IN,
            workflowStep.resource.category
        ).length > 0;
    }


    public async updateWorkflowSteps() {

        const targetIds: string[] = set(
            this.documents.map(document => {
                return document.resource.relations?.[Relation.Workflow.IS_EXECUTION_TARGET_OF] ?? [];
            }).flat()
        );
        this.workflowSteps = await this.datastore.getMultiple(targetIds);
        sortWorkflowSteps(this.workflowSteps);
    }


    public getExecutionDateLabel(workflowStep: Document): string {

        if (!workflowStep.resource.executionDate) return '';

        const timeSuffix: string = $localize `:@@revisionLabel.timeSuffix:Uhr`;

        return DateSpecification.generateLabel(
            workflowStep.resource.executionDate,
            getSystemTimezone(),
            timeSuffix,
            Settings.getLocale()
        );
    }


    private async setRelation(workflowStep: Document) {

        const oldVersion: Document = Document.clone(workflowStep);

        const currentTargetIds: string[] = workflowStep.resource.relations?.[Relation.Workflow.IS_EXECUTED_ON] ?? [];
        const newTargetIds: string[] = this.documents.map(document => {
            return document.resource.id;
        });
        workflowStep.resource.relations[Relation.Workflow.IS_EXECUTED_ON] = set(currentTargetIds.concat(newTargetIds));

        await this.applyRelationChanges(workflowStep, oldVersion);
    }


    private async applyRelationChanges(workflowStep: Document, oldVersion: Document) {

        try {
            await this.relationsManager.update(workflowStep, oldVersion);
        } catch (err) {
            console.error(err);
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
        }
    }


    private static buildWorkflowStepDocument(category: CategoryForm): NewDocument {

        return {
            resource: {
                identifier: '',
                category: category.name,
                state: 'in progress',
                relations: {}
            }
        };
    }
}
