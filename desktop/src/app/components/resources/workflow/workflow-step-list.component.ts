import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from '../../../services/menu-context';
import { Map } from 'tsfun';
import { Document, RelationsManager, Resource, Labels, ProjectConfiguration, DateSpecification, WorkflowStepDocument,
    Datastore } from 'idai-field-core';
import { AngularUtility } from '../../../angular/angular-utility';
import { DoceditComponent } from '../../docedit/docedit.component';
import { Settings } from '../../../services/settings/settings';
import { getSystemTimezone } from '../../../util/timezones';
import { DeleteWorkflowStepModalComponent } from './delete/delete-workflow-step-modal.component';
import { UtilTranslations } from '../../../util/util-translations';
import { Menus } from '../../../services/menus';


@Component({
    selector: 'workflow-step-list',
    templateUrl: './workflow-step-list.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class WorkflowStepListComponent implements OnChanges {

    @Input() workflowSteps: Array<WorkflowStepDocument>;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();
    @Output() onRelationTargetSelected: EventEmitter<Document> = new EventEmitter<Document>();

    public readonly itemSize: number = 55;

    private relationTargets: Map<Map<Array<Document>>> = {};
    private dateLabels: Map<string> = {};


    constructor(private menus: Menus,
                private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private utilTranslations: UtilTranslations,
                private datastore: Datastore) {}


    public getCategoryLabel = (workflowStep: WorkflowStepDocument) =>
        this.labels.get(this.projectConfiguration.getCategory(workflowStep));
    
    public getShortDescriptionLabel = (workflowStep: WorkflowStepDocument) =>
        Resource.getShortDescriptionLabel(workflowStep.resource, this.labels, this.projectConfiguration);

    public getDateLabel = (workflowStep: Document) => this.dateLabels[workflowStep.resource.id];

    public trackWorkflowStep = (_: number, workflowStep: WorkflowStepDocument) => workflowStep.resource.id;


    async ngOnChanges() {
        
        for (let workflowStep of this.workflowSteps) {
            await this.updateListEntry(workflowStep);
        }
    }
    
    
    public getRelationTargets(workflowStep: WorkflowStepDocument,
                              relationName: 'isExecutedOn'|'resultsIn'): Array<Document> {

        return this.relationTargets[workflowStep.resource.id]?.[relationName];
    }


    public async editWorkflowStep(workflowStep: WorkflowStepDocument) {

        if (await this.openWorkflowStepEditorModal(workflowStep)) {
            await this.updateListEntry(workflowStep);
            this.onChanged.emit();
        }
    }


    public async deleteWorkflowStep(workflowStep: WorkflowStepDocument) {

        this.menus.setContext(MenuContext.DOCEDIT);

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteWorkflowStepModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.workflowStep = workflowStep;

        try {
            await modalRef.result;
            await this.relationsManager.remove(workflowStep);
            this.onChanged.emit();
        } catch(err) {
            if (err !== 'cancel') console.error(err);
        } finally {
            AngularUtility.blurActiveElement();
            this.menus.setContext(MenuContext.WORKFLOW_EDITOR);
        }
    }


    private async openWorkflowStepEditorModal(workflowStep: WorkflowStepDocument): Promise<boolean> {
    
        const context: MenuContext = this.menus.getContext();
        this.menus.setContext(MenuContext.DOCEDIT);

        const modalRef: NgbModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.setDocument(workflowStep);

        try {
            await modalRef.result;
            return true;
        } catch(err) {
            if (err !== 'cancel') console.error(err);
            return false;
        } finally {
            AngularUtility.blurActiveElement();
            this.menus.setContext(context);
        }
    }


    private async updateListEntry(workflowStep: WorkflowStepDocument) {

        await this.updateRelationTargets(workflowStep);
        this.updateDateLabel(workflowStep);
    }


    private async updateRelationTargets(workflowStep: WorkflowStepDocument) {

        if (!this.relationTargets[workflowStep.resource.id]) this.relationTargets[workflowStep.resource.id] = {};

        for (let relationName of ['isExecutedOn', 'resultsIn']) {
            const targets: Array<Document> = await this.fetchRelationTargets(workflowStep, relationName);
            this.relationTargets[workflowStep.resource.id][relationName] = targets;
        }
    }


    private updateDateLabel(workflowStep: WorkflowStepDocument) {

        if (!workflowStep.resource.date) {
            delete this.dateLabels[workflowStep.resource.id];
            return;
        }

        const timeSuffix: string = $localize `:@@revisionLabel.timeSuffix:Uhr`;

        this.dateLabels[workflowStep.resource.id] = DateSpecification.generateLabel(
            workflowStep.resource.date,
            getSystemTimezone(),
            timeSuffix,
            Settings.getLocale(),
            (term: string) => this.utilTranslations.getTranslation(term),
            false
        );
    }


    private async fetchRelationTargets(workflowStep: WorkflowStepDocument,
                                       relationName: string): Promise<Array<Document>> {

        const targetIds: string[] = workflowStep.resource.relations[relationName];

        return targetIds
            ? this.datastore.getMultiple(targetIds)
            : [];
    }
}
