import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from '../../../services/menu-context';
import { Document, RelationsManager, Relation, Resource, Labels, ProjectConfiguration, DateSpecification,
    WorkflowStepDocument } from 'idai-field-core';
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
export class WorkflowStepListComponent {

    @Input() workflowSteps: Array<WorkflowStepDocument>;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();


    constructor(private menus: Menus,
                private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private utilTranslations: UtilTranslations) {}


    public getCategoryLabel = (workflowStep: WorkflowStepDocument) =>
        this.labels.get(this.projectConfiguration.getCategory(workflowStep));
    
    public getShortDescriptionLabel = (workflowStep: WorkflowStepDocument) =>
        Resource.getShortDescriptionLabel(workflowStep.resource, this.labels, this.projectConfiguration);


    public async editWorkflowStep(workflowStep: WorkflowStepDocument) {

        if (await this.openWorkflowStepEditorModal(workflowStep)) {
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


    public isResultsInRelationAvailable(workflowStep: WorkflowStepDocument): boolean {

        return this.projectConfiguration.getAllowedRelationRangeCategories(
            Relation.Workflow.RESULTS_IN,
            workflowStep.resource.category
        ).length > 0;
    }


    public getDateLabel(workflowStep: Document): string {

        if (!workflowStep.resource.date) return '';

        const timeSuffix: string = $localize `:@@revisionLabel.timeSuffix:Uhr`;

        return DateSpecification.generateLabel(
            workflowStep.resource.date,
            getSystemTimezone(),
            timeSuffix,
            Settings.getLocale(),
            (term: string) => this.utilTranslations.getTranslation(term),
            false
        );
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
}
