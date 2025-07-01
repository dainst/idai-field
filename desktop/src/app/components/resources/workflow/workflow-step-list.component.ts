import { Component, Input, Output, EventEmitter, OnChanges, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { MenuContext } from '../../../services/menu-context';
import { Map } from 'tsfun';
import { Document, RelationsManager, Resource, Labels, ProjectConfiguration, DateSpecification, WorkflowStepDocument,
    Datastore, SortMode, ChangesStream } from 'idai-field-core';
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
export class WorkflowStepListComponent implements OnInit, OnChanges, OnDestroy {

    @Input() workflowSteps: Array<WorkflowStepDocument>;
    @Input() sortMode: SortMode;

    @Output() onChanged: EventEmitter<WorkflowStepDocument|void> = new EventEmitter<WorkflowStepDocument|void>();
    @Output() onRelationTargetSelected: EventEmitter<Document> = new EventEmitter<Document>();
    @Output() onSortModeChanged: EventEmitter<SortMode> = new EventEmitter<SortMode>();
    
    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;

    public readonly itemSize: number = 59;

    private relationTargets: Map<Map<Array<Document>>> = {};
    private dateLabels: Map<string> = {};
    private changesSubscription: Subscription;


    constructor(private menus: Menus,
                private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private utilTranslations: UtilTranslations,
                private datastore: Datastore,
                private changesStream: ChangesStream) {}


    public getCategoryLabel = (workflowStep: WorkflowStepDocument) =>
        this.labels.get(this.projectConfiguration.getCategory(workflowStep));
    
    public getShortDescriptionLabel = (workflowStep: WorkflowStepDocument) =>
        Resource.getShortDescriptionLabel(workflowStep.resource, this.labels, this.projectConfiguration);

    public getDateLabel = (workflowStep: Document) => this.dateLabels[workflowStep.resource.id];

    public trackWorkflowStep = (_: number, workflowStep: WorkflowStepDocument) => workflowStep.resource.id;


    ngOnInit() {
        
        this.changesSubscription = this.changesStream.changesNotifications().subscribe(async document => {
            if (this.workflowSteps.find(workflowStep => workflowStep.resource.id === document.resource.id)) {
                await this.updateListEntry(document as WorkflowStepDocument);
            }
        })
    }


    ngOnDestroy() {
        
        this.changesSubscription.unsubscribe();
    }


    async ngOnChanges() {
        
        for (let workflowStep of this.workflowSteps) {
            await this.updateListEntry(workflowStep);
        }
    }


    public toggleSortMode(fieldName: 'identifier'|'date') {

        if (fieldName === 'identifier') {
            this.sortMode = this.sortMode === SortMode.Alphanumeric
                ? SortMode.AlphanumericDescending
                : SortMode.Alphanumeric;
        } else {
            this.sortMode = this.sortMode === SortMode.Date
                ? SortMode.DateDescending
                : SortMode.Date;
        }

        this.onSortModeChanged.emit(this.sortMode);
    }
    
    
    public getRelationTargets(workflowStep: WorkflowStepDocument,
                              relationName: 'isExecutedOn'|'resultsIn'): Array<Document> {

        return this.relationTargets[workflowStep.resource.id]?.[relationName];
    }


    public async editWorkflowStep(workflowStep: WorkflowStepDocument) {

        if (await this.openWorkflowStepEditorModal(workflowStep)) {
            await this.updateListEntry(workflowStep);
            this.onChanged.emit(workflowStep);
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
