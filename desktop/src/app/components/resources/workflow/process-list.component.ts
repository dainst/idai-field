import { Component, Input, Output, EventEmitter, OnChanges, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { MenuContext } from '../../../services/menu-context';
import { Map } from 'tsfun';
import { Document, RelationsManager, Resource, Labels, ProjectConfiguration, DateSpecification, ProcessDocument,
    Datastore, SortMode, ChangesStream } from 'idai-field-core';
import { AngularUtility } from '../../../angular/angular-utility';
import { DoceditComponent } from '../../docedit/docedit.component';
import { Settings } from '../../../services/settings/settings';
import { getSystemTimezone } from '../../../util/timezones';
import { DeleteProcessModalComponent } from './delete/delete-process-modal.component';
import { UtilTranslations } from '../../../util/util-translations';
import { Menus } from '../../../services/menus';


@Component({
    selector: 'process-list',
    templateUrl: './process-list.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ProcessListComponent implements OnInit, OnChanges, OnDestroy {

    @Input() processes: Array<ProcessDocument>;
    @Input() sortMode: SortMode;

    @Output() onChanged: EventEmitter<ProcessDocument|void> = new EventEmitter<ProcessDocument|void>();
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


    public getCategoryLabel = (process: ProcessDocument) =>
        this.labels.get(this.projectConfiguration.getCategory(process));
    
    public getShortDescriptionLabel = (process: ProcessDocument) =>
        Resource.getShortDescriptionLabel(process.resource, this.labels, this.projectConfiguration);

    public getDateLabel = (process: Document) => this.dateLabels[process.resource.id];

    public trackProcess = (_: number, process: ProcessDocument) => process.resource.id;


    ngOnInit() {
        
        this.changesSubscription = this.changesStream.changesNotifications().subscribe(async document => {
            if (this.processes.find(process => process.resource.id === document.resource.id)) {
                await this.updateListEntry(document as ProcessDocument);
            }
        })
    }


    ngOnDestroy() {
        
        this.changesSubscription.unsubscribe();
    }


    async ngOnChanges() {
        
        for (let process of this.processes) {
            await this.updateListEntry(process);
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
    
    
    public getRelationTargets(process: ProcessDocument,
                              relationName: 'isCarriedOutOn'|'resultsIn'): Array<Document> {

        return this.relationTargets[process.resource.id]?.[relationName];
    }


    public async editProcess(process: ProcessDocument) {

        if (await this.openProcessEditorModal(process)) {
            await this.updateListEntry(process);
            this.onChanged.emit(process);
        }
    }


    public async deleteProcess(process: ProcessDocument) {

        const context: MenuContext = this.menus.getContext();
        this.menus.setContext(MenuContext.DOCEDIT);

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteProcessModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.process = process;

        try {
            await modalRef.result;
            await this.relationsManager.remove(process);
            this.onChanged.emit();
        } catch(err) {
            if (err !== 'cancel') console.error(err);
        } finally {
            AngularUtility.blurActiveElement();
            this.menus.setContext(context);
        }
    }


    private async openProcessEditorModal(process: ProcessDocument): Promise<boolean> {
    
        const context: MenuContext = this.menus.getContext();
        this.menus.setContext(MenuContext.DOCEDIT);

        const modalRef: NgbModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.setDocument(process);

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


    private async updateListEntry(process: ProcessDocument) {

        await this.updateRelationTargets(process);
        this.updateDateLabel(process);
    }


    private async updateRelationTargets(process: ProcessDocument) {

        if (!this.relationTargets[process.resource.id]) this.relationTargets[process.resource.id] = {};

        for (let relationName of ['isCarriedOutOn', 'resultsIn']) {
            const targets: Array<Document> = await this.fetchRelationTargets(process, relationName);
            this.relationTargets[process.resource.id][relationName] = targets;
        }
    }


    private updateDateLabel(process: ProcessDocument) {

        if (!process.resource.date) {
            delete this.dateLabels[process.resource.id];
            return;
        }

        const timeSuffix: string = $localize `:@@revisionLabel.timeSuffix:Uhr`;

        this.dateLabels[process.resource.id] = DateSpecification.generateLabel(
            process.resource.date,
            getSystemTimezone(),
            timeSuffix,
            Settings.getLocale(),
            (term: string) => this.utilTranslations.getTranslation(term),
            false
        );
    }


    private async fetchRelationTargets(process: ProcessDocument,
                                       relationName: string): Promise<Array<Document>> {

        const targetIds: string[] = process.resource.relations[relationName];

        return targetIds
            ? this.datastore.getMultiple(targetIds)
            : [];
    }
}
