import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { intersection, to } from 'tsfun';
import { CategoryForm, ProjectConfiguration, Document, Relation, Datastore, Labels, Named } from 'idai-field-core';
import { sortWorkflowSteps } from '../sort-workflow-steps';


@Component({
    selector: 'workflow-step-link-modal',
    templateUrl: './workflow-step-link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowStepLinkModalComponent {

    public baseDocuments: Array<Document>;

    public filterOptions: Array<CategoryForm> = [];
    public selectedDocument: Document;
    public availableWorkflowSteps: Array<Document>;

    private allowedWorkflowStepCategories: Array<CategoryForm>;


    constructor(public activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private labels: Labels) {}


    public getCategoryLabel = (workflowStep: Document) =>
        this.labels.get(this.projectConfiguration.getCategory(workflowStep));

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {
    
        if (event.key === 'Escape') this.cancel();
    }


    public initialize() {

        this.allowedWorkflowStepCategories = this.getAllowedWorkflowStepCategories();
        this.filterOptions = this.getFilterOptions();
    }


    public async selectDocument(document: Document) {

        this.selectedDocument = document;
        this.availableWorkflowSteps = await this.getAvailableWorkflowSteps();
        sortWorkflowSteps(this.availableWorkflowSteps);
    }


    public selectWorkflowStep(workflowStep: Document) {

        this.activeModal.close(workflowStep);
    }


    public reset() {

        this.selectedDocument = undefined;
        this.availableWorkflowSteps = undefined;
    }


    public getConstraints = () => {
    
        return {
            'id:match': {
                value: this.getIdsToIgnore(),
                subtract: true
            }
        };
    }


    private getAllowedWorkflowStepCategories(): Array<CategoryForm> {

        return intersection(
            this.baseDocuments.map(document => {
                return this.projectConfiguration.getAllowedRelationRangeCategories(
                    Relation.Workflow.IS_EXECUTION_TARGET_OF,
                    document.resource.category
                );
            })
        );
    }


    private getFilterOptions(): Array<CategoryForm> {

        return this.allowedWorkflowStepCategories.reduce((result, subcategory) => {
            return result.concat(
                this.projectConfiguration.getAllowedRelationRangeCategories(
                    Relation.Workflow.IS_EXECUTED_ON, subcategory.name
                )
            );
        }, []);
    }


    private async getAvailableWorkflowSteps(): Promise<Array<Document>> {

        const targetIds: string[] = this.selectedDocument.resource.relations
            ?.[Relation.Workflow.IS_EXECUTION_TARGET_OF]
            ?.filter(targetId => !this.baseDocuments.find(document => {
                return document.resource.relations?.[Relation.Workflow.IS_EXECUTION_TARGET_OF].includes(targetId);
            }));

        const workflowSteps: Array<Document> = targetIds?.length
            ? await this.datastore.getMultiple(targetIds)
            : [];

        return workflowSteps.filter(workflowStep => {
            return this.allowedWorkflowStepCategories.map(to(Named.NAME)).includes(workflowStep.resource.category);
        });
    }


    private getIdsToIgnore(): string[] {

        return this.baseDocuments.map(document => document.resource.id);
    }
}
