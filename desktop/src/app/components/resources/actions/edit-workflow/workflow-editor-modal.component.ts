import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { intersection, set } from 'tsfun';
import { CategoryForm, FieldDocument, Document, NewDocument, RelationsManager, Relation, Datastore,
    SortUtil, ProjectConfiguration, SortMode, ProcessDocument } from 'idai-field-core';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { DoceditComponent } from '../../../docedit/docedit.component';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';
import { AngularUtility } from '../../../../angular/angular-utility';
import { sortProcesses } from './sort-processes';
import { Routing } from '../../../../services/routing';


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

    public processes: Array<ProcessDocument>;
    public allowedProcessCategories: Array<CategoryForm>;
    public sortMode: SortMode = SortMode.Date;


    constructor(private activeModal: NgbActiveModal,
                private menus: Menus,
                private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private datastore: Datastore,
                private messages: Messages,
                private routing: Routing,
                private projectConfiguration: ProjectConfiguration) {}


    public cancel = () => this.activeModal.close();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.WORKFLOW_EDITOR) {
            this.cancel();
        }
    }


    public async initialize() {

        this.allowedProcessCategories = this.getAllowedProcessCategories();
        this.sortDocuments();
        await this.updateProcesses();
    }


    public async setSortMode(sortMode: SortMode) {

        this.sortMode = sortMode;
        await this.updateProcesses();
    }


    public async createProcess(category: CategoryForm, createMultiple: boolean) {

        const newProcesses: Array<ProcessDocument> = await this.openProcessEditorModal(
            WorkflowEditorModalComponent.buildProcessDocument(
                category,
                createMultiple ? [] : this.documents
            ) as ProcessDocument,
            createMultiple ? this.documents.length - 1 : undefined
        );
        if (!newProcesses) return;

        if (createMultiple) {
            for (let i = 0; i < newProcesses.length; i++) {
                await this.setRelation(newProcesses[i], [this.documents[i]]);
            }
        }

        await this.updateProcesses();
    }


    public async linkProcess(process: ProcessDocument, targets: Array<FieldDocument>) {

        await this.setRelation(process, targets);
        await this.updateProcesses();
    }


    public async updateProcesses() {

        this.processes = (await this.datastore.find({
            constraints: { 'isCarriedOutOn:contain': this.documents.map(document => document.resource.id) }
        })).documents as Array<ProcessDocument>;

        sortProcesses(this.processes, this.sortMode);
    }


    public jumpToRelationTarget(relationTarget: Document) {

        this.activeModal.close();
        this.routing.jumpToResource(relationTarget);
    }


    private getAllowedProcessCategories(): Array<CategoryForm> {

        return intersection(
            this.documents.map(document => {
                return this.projectConfiguration.getAllowedRelationDomainCategories(
                    Relation.Workflow.IS_CARRIED_OUT_ON,
                    document.resource.category
                );
            })
        );
    }


    private sortDocuments() {

        this.documents.sort((document1, document2) => {
            return SortUtil.alnumCompare(document1.resource.identifier, document2.resource.identifier);
        });
    }


    /**
     * @returns edited document if changes have been saved, undefined if the modal has been canceled
     */
    private async openProcessEditorModal(process: ProcessDocument, numberOfDuplicates?: number)
            : Promise<Array<ProcessDocument>|undefined> {
    
        const context: MenuContext = this.menus.getContext();
        this.menus.setContext(MenuContext.DOCEDIT);

        const modalRef: NgbModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.setDocument(process, ['isCarriedOutOn']);
        modalRef.componentInstance.disabledRelationFields = ['isCarriedOutOn'];
        if (numberOfDuplicates) modalRef.componentInstance.fixedNumberOfDuplicates = numberOfDuplicates;

        try {
            return (await modalRef.result).documents;
        } catch(err) {
            if (err !== 'cancel' && err !== 'discard') console.error(err);
        } finally {
            AngularUtility.blurActiveElement();
            this.menus.setContext(context);
        }
    }


    private async setRelation(process: ProcessDocument, targets: Array<FieldDocument>) {

        const oldVersion: ProcessDocument = Document.clone(process);

        const currentTargetIds: string[] = process.resource.relations?.[Relation.Workflow.IS_CARRIED_OUT_ON] ?? [];
        const newTargetIds: string[] = targets.map(document => document.resource.id);
        process.resource.relations[Relation.Workflow.IS_CARRIED_OUT_ON] = set(currentTargetIds.concat(newTargetIds));

        await this.applyRelationChanges(process, oldVersion);
    }


    private async applyRelationChanges(process: ProcessDocument, oldVersion: ProcessDocument) {

        try {
            await this.relationsManager.update(process, oldVersion);
        } catch (err) {
            console.error(err);
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
        }
    }


    private static buildProcessDocument(category: CategoryForm,
                                        carriedOutOnTargets: Array<FieldDocument>): NewDocument {

        return {
            resource: {
                identifier: '',
                category: category.name,
                state: 'in progress',
                relations: {
                    isCarriedOutOn: carriedOutOnTargets.map(target => target.resource.id)
                }
            }
        };
    }
}
