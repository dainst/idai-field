import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map, isArray } from 'tsfun';
import { Datastore, PouchdbDatastore, Document, ImageStore, FileInfo, ImageVariant,
    ProjectConfiguration, DatastoreErrors} from 'idai-field-core';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { RevisionLabels } from '../../services/revision-labels';
import { Loading } from '../widgets/loading';
import { AngularUtility } from '../../angular/angular-utility';
import { Routing } from '../../services/routing';
import { getFileSizeLabel } from '../../util/get-file-size-label';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import {
    KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE,
    KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD,
    KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD,
    KOREAN_FIELDWORK_INVESTIGATION_MODES,
    createKoreanFieldworkProjectSetupResourceUpdates,
    getKoreanFieldworkInvestigationModeLabel,
    getKoreanFieldworkProjectResourceValue,
    isKoreanFieldworkProject,
    isKoreanFieldworkProjectSetupFilledIn
} from '../../util/korean-fieldwork-project-setup';
import {
    KoreanFieldworkPriorityIssue,
    KoreanFieldworkTodayStats,
    makeKoreanFieldworkTodayStats
} from '../../util/korean-fieldwork-today-stats';
import {
    KoreanFieldworkWorkflowAction,
    KoreanFieldworkWorkflowStep,
    makeKoreanFieldworkWorkflowSteps
} from '../../util/korean-fieldwork-workflow';
import {
    KoreanFieldworkDailyNotebookDigest,
    KoreanFieldworkNotebookEntry,
    makeKoreanFieldworkDailyNotebookDigest
} from '../../util/korean-fieldwork-notebook-digest';
import { ViewFacade } from '../resources/view/view-facade';

type KoreanNotebookFilter = 'recent'|'nextWork'|'needsEvidence';


@Component({
    selector: 'project-information-modal',
    templateUrl: './project-information-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})

/**
 * @author Thomas Kleinke
 */
export class ProjectInformationModalComponent implements OnInit {

    public totalDocumentCount: number;
    public imageDocumentCount: number;
    public typeDocumentCount: number;
    public storagePlaceDocumentCount: number;
    public processDocumentCount: number;

    public lastChangedDocument: Document|undefined;
    public lastChangedDocumentUser: string;
    public lastChangedDocumentDate: string;

    public thumbnailFileCount: number;
    public originalFileCount: number;
    public displayFileCount: number;
    public thumbnailFileSize: string;
    public originalFileSize: string;
    public displayFileSize: string;
    public projectDocument: Document|undefined;

    public koreanInvestigationMode: string = KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE;
    public koreanBoundarySummary: string = '';
    public savingKoreanProjectSetup: boolean = false;
    public koreanProjectSetupSaved: boolean = false;
    public readonly koreanInvestigationModes = KOREAN_FIELDWORK_INVESTIGATION_MODES;
    public koreanTodayStats: KoreanFieldworkTodayStats|undefined;
    public koreanWorkflowSteps: KoreanFieldworkWorkflowStep[] = [];
    public koreanNotebookDigest: KoreanFieldworkDailyNotebookDigest|undefined;
    public koreanNotebookFilter: KoreanNotebookFilter = 'recent';
    public readonly koreanNotebookFilters: { id: KoreanNotebookFilter; label: string }[] = [
        { id: 'recent', label: '최근' },
        { id: 'nextWork', label: '다음' },
        { id: 'needsEvidence', label: '번호' }
    ];


    constructor(public activeModal: NgbActiveModal,
                private pouchdbDatastore: PouchdbDatastore,
                private datastore: Datastore,
                private imagestore: ImageStore,
                private settingsProvider: SettingsProvider,
                private projectConfiguration: ProjectConfiguration,
                private messages: Messages,
                private loading: Loading,
                private routing: Routing,
                private router: Router,
                private viewFacade: ViewFacade,
                private decimalPipe: DecimalPipe,
                private menuService: Menus) {}

    
    public isLoading = () => this.loading.isLoading('project-information-modal');

    public getLastChangedId = () => this.lastChangedDocument.resource.id;

    public getProjectIdentifier = () => this.settingsProvider.getSettings().selectedProject;

    public isKoreanFieldworkProject = () =>
        isKoreanFieldworkProject(this.projectDocument, this.projectConfiguration);

    public getKoreanInvestigationModeLabel = () =>
        getKoreanFieldworkInvestigationModeLabel(
            this.getProjectResourceValue(KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD)
        );

    public getKoreanBoundarySummary = () =>
        this.getProjectResourceValue(KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD) ?? '';

    public shouldShowKoreanTodayStats = () =>
        this.isKoreanFieldworkProject() && this.koreanTodayStats !== undefined;

    public getKoreanPriorityIssues = () =>
        this.koreanTodayStats?.priorityIssues ?? [];

    public getKoreanWorkflowSteps = () => this.koreanWorkflowSteps;

    public hasKoreanWorkflowSteps = () => this.getKoreanWorkflowSteps().length > 0;

    public canRunKoreanWorkflowStep = (step: KoreanFieldworkWorkflowStep) => !!step.action;

    public canRunKoreanWorkflowStepSecondaryAction = (step: KoreanFieldworkWorkflowStep) => !!step.secondaryAction;

    public shouldShowKoreanNotebookDigest = () =>
        this.isKoreanFieldworkProject()
        && !!this.koreanNotebookDigest
        && (
            this.koreanNotebookDigest.entries.length > 0
            || this.koreanNotebookDigest.dailyLogDocuments.length > 0
        );

    public getKoreanNotebookNextWorkEntries = () =>
        this.koreanNotebookDigest?.nextWorkEntries.slice(0, 3) ?? [];

    public getKoreanNotebookEvidenceMissingEntries = () =>
        this.koreanNotebookDigest?.evidenceMissingEntries.slice(0, 3) ?? [];

    public getKoreanNotebookEntryCount = () =>
        this.koreanNotebookDigest?.entries.length ?? 0;

    public getKoreanNotebookDailyLogCount = () =>
        this.koreanNotebookDigest?.dailyLogDocuments.length ?? 0;

    public getKoreanNotebookNextWorkCount = () =>
        this.koreanNotebookDigest?.nextWorkEntries.length ?? 0;

    public getKoreanNotebookEvidenceMissingCount = () =>
        this.koreanNotebookDigest?.evidenceMissingEntries.length ?? 0;

    public getKoreanNotebookFilterCount(filter: KoreanNotebookFilter): number {

        switch (filter) {
            case 'nextWork':
                return this.getKoreanNotebookNextWorkCount();
            case 'needsEvidence':
                return this.getKoreanNotebookEvidenceMissingCount();
            case 'recent':
                return this.getKoreanNotebookEntryCount();
        }
    }

    public setKoreanNotebookFilter(filter: KoreanNotebookFilter) {

        if (this.getKoreanNotebookFilterCount(filter) === 0) return;

        this.koreanNotebookFilter = filter;
    }

    public getKoreanNotebookVisibleEntries(): KoreanFieldworkNotebookEntry[] {

        switch (this.koreanNotebookFilter) {
            case 'nextWork':
                return this.getKoreanNotebookNextWorkEntries();
            case 'needsEvidence':
                return this.getKoreanNotebookEvidenceMissingEntries();
            case 'recent':
                return this.koreanNotebookDigest?.entries.slice(0, 5) ?? [];
        }
    }

    public getKoreanNotebookEntryTone(entry: KoreanFieldworkNotebookEntry): 'warning'|'info'|'neutral' {

        if (entry.needsEvidenceNumbers) return 'warning';
        return entry.nextWork ? 'info' : 'neutral';
    }

    public getKoreanNotebookEntryDetail(entry: KoreanFieldworkNotebookEntry): string {

        if (this.koreanNotebookFilter === 'needsEvidence' && entry.needsEvidenceNumbers) {
            return '사진·도면·스케치·유물·시료 번호를 이어서 확인하세요.';
        }

        return entry.nextWork || entry.detail || '야장 내용을 확인하세요.';
    }

    public getKoreanNotebookEntryOpenLabel(entry: KoreanFieldworkNotebookEntry): string {

        return entry.targetDocument ? '대상 열기' : `${entry.sourceLabel} 열기`;
    }

    public canOpenKoreanNotebookSource = (entry: KoreanFieldworkNotebookEntry) =>
        !!entry.targetDocument
        && entry.targetDocument.resource.id !== entry.sourceDocument.resource.id;

    public openKoreanNotebookEntry(entry: KoreanFieldworkNotebookEntry) {

        this.activeModal.close();
        this.routing.jumpToResource(entry.targetDocument ?? entry.sourceDocument);
    }

    public openKoreanNotebookSource(entry: KoreanFieldworkNotebookEntry) {

        this.activeModal.close();
        this.routing.jumpToResource(entry.sourceDocument);
    }

    public openKoreanDailyLog() {

        if (!this.koreanNotebookDigest?.primaryDailyLog) return;

        this.activeModal.close();
        this.routing.jumpToResource(this.koreanNotebookDigest.primaryDailyLog);
    }

    public getKoreanWorkflowStepStatusLabel(status: KoreanFieldworkWorkflowStep['status']): string {

        switch (status) {
            case 'done':
                return '완료';
            case 'current':
                return '다음';
            case 'attention':
                return '확인';
            case 'todo':
                return '대기';
        }
    }

    public async runKoreanWorkflowStep(step: KoreanFieldworkWorkflowStep) {

        if (!step.action) return;

        try {
            await this.runKoreanWorkflowAction(step.action);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async runKoreanWorkflowStepSecondaryAction(step: KoreanFieldworkWorkflowStep) {

        if (!step.secondaryAction) return;

        try {
            await this.runKoreanWorkflowAction(step.secondaryAction);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public setKoreanInvestigationMode(modeId: string) {

        this.koreanInvestigationMode = modeId;
        this.koreanProjectSetupSaved = false;
    }

    public markKoreanProjectSetupChanged() {

        this.koreanProjectSetupSaved = false;
    }

    public canSaveKoreanProjectSetup = () =>
        this.isKoreanFieldworkProject()
        && !this.savingKoreanProjectSetup
        && isKoreanFieldworkProjectSetupFilledIn(this.koreanInvestigationMode, this.koreanBoundarySummary)
        && this.hasKoreanProjectSetupChanges();

    public hasKoreanProjectSetupChanges = () =>
        this.koreanInvestigationMode !== (
            this.getProjectResourceValue(KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD)
                ?? KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE
        )
        || this.koreanBoundarySummary.trim() !== this.getKoreanBoundarySummary();

    public resetKoreanProjectSetupEdits() {

        this.setKoreanProjectSetupFieldsFromDocument();
        this.koreanProjectSetupSaved = false;
    }

    public async saveKoreanProjectSetup() {

        if (!this.projectDocument || !this.canSaveKoreanProjectSetup()) return;

        const updatedProjectDocument: Document = Document.clone(this.projectDocument);
        Object.assign(
            updatedProjectDocument.resource,
            createKoreanFieldworkProjectSetupResourceUpdates(
                this.koreanInvestigationMode,
                this.koreanBoundarySummary
            )
        );

        try {
            this.savingKoreanProjectSetup = true;
            this.projectDocument = await this.datastore.update(updatedProjectDocument);
            this.setKoreanProjectSetupFieldsFromDocument();
            await this.updateKoreanFieldworkSummary();
            this.koreanProjectSetupSaved = true;
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        } finally {
            this.savingKoreanProjectSetup = false;
        }
    }
  

    async ngOnInit() {

        AngularUtility.blurActiveElement();

        try {
            this.loading.start('project-information-modal');
            await this.updateInformation();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        } finally {
            this.loading.stop('project-information-modal');
        }
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape'
                && [MenuContext.MODAL, MenuContext.CONFIGURATION_MODAL].includes(this.menuService.getContext())) {
            this.activeModal.close();
        }
    }


    public goToLastChangedResource() {

        this.activeModal.close();
        this.routing.jumpToResource(this.lastChangedDocument);
    }


    public async openKoreanPriorityIssue(issue: KoreanFieldworkPriorityIssue) {

        try {
            const issueDocument = await this.datastore.get(issue.documentId);
            this.activeModal.close();
            this.routing.jumpToResource(issueDocument);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    private async runKoreanWorkflowAction(action: KoreanFieldworkWorkflowAction) {

        switch (action.type) {
            case 'openProjectInfo':
                return;
            case 'openMap':
                this.activeModal.close();
                await this.viewFacade.deselect();
                this.viewFacade.setMode('map');
                return;
            case 'openImport':
                this.activeModal.close();
                await this.router.navigate(['import']);
                return;
            case 'openDocument': {
                const document = await this.datastore.get(action.documentId);
                this.activeModal.close();
                this.routing.jumpToResource(document);
                return;
            }
        }
    }


    private async updateInformation() {

        this.totalDocumentCount = await this.getDocumentCount();
        this.imageDocumentCount = await this.getImageDocumentCount();
        this.typeDocumentCount = await this.getTypeDocumentCount();
        this.storagePlaceDocumentCount = await this.getStoragePlaceDocumentCount();
        this.processDocumentCount = await this.getProcessDocumentCount();
        this.projectDocument = await this.datastore.get('project');
        this.setKoreanProjectSetupFieldsFromDocument();
        await this.updateKoreanFieldworkSummary();

        this.lastChangedDocument = await this.getLastChangedDocument();
        if (this.lastChangedDocument) {
            this.lastChangedDocumentUser = Document.getLastModified(this.lastChangedDocument).user;
            this.lastChangedDocumentDate = RevisionLabels.getLastModifiedDateLabel(
                this.lastChangedDocument,
                $localize `:@@revisionLabel.timeSuffix:Uhr`
            );
        }
        
        const fileInfos: Map<FileInfo> = await this.imagestore.getFileInfos(
            this.settingsProvider.getSettings().selectedProject
        );

        this.thumbnailFileCount = await ProjectInformationModalComponent.getFileCount(
            fileInfos, ImageVariant.THUMBNAIL
        );
        this.originalFileCount = await ProjectInformationModalComponent.getFileCount(
            fileInfos, ImageVariant.ORIGINAL
        );
        this.displayFileCount = await ProjectInformationModalComponent.getFileCount(
            fileInfos, ImageVariant.DISPLAY
        );

        this.thumbnailFileSize = await this.getFileSize(ImageVariant.THUMBNAIL);
        this.originalFileSize = await this.getFileSize(ImageVariant.ORIGINAL);
        this.displayFileSize = await this.getFileSize(ImageVariant.DISPLAY);
    }


    private async getDocumentCount(): Promise<number> {

        return (await this.pouchdbDatastore.getDb().info()).doc_count;
    }


    private async getImageDocumentCount(): Promise<number> {

        return await this.getDocumentCountForCategories(
            this.projectConfiguration.getImageCategories().map(category => category.name)
        );
    }


    private async getTypeDocumentCount(): Promise<number> {

        return await this.getDocumentCountForCategories(
            this.projectConfiguration.getTypeManagementCategories().map(category => category.name)
        );
    }


    private async getStoragePlaceDocumentCount(): Promise<number> {

        return await this.getDocumentCountForCategories(
            this.projectConfiguration.getInventoryCategories().map(category => category.name)
        );
    }


    private async getProcessDocumentCount(): Promise<number> {

        return await this.getDocumentCountForCategories(
            this.projectConfiguration.getWorkflowCategories().map(category => category.name)
        );
    }


    private async getDocumentCountForCategories(categories: string[]): Promise<number> {

        return (await this.datastore.findIds({ categories })).totalCount;
    }

    
    private async getLastChangedDocument(): Promise<Document|undefined> {

        const lastChangedDocumentId: string|undefined = await this.pouchdbDatastore.getLatestChange();
        if (!lastChangedDocumentId) return undefined;

        try {
            return await this.datastore.get(lastChangedDocumentId);
        } catch (err) {
            if (isArray(err) && err[0] === DatastoreErrors.DOCUMENT_NOT_FOUND) {
                return undefined;
            } else {
                throw err;
            }
        }
    }


    private async getFileSize(variant: ImageVariant): Promise<string> {

        const fileList = await this.imagestore.getFileInfos(
            this.settingsProvider.getSettings().selectedProject,
            [variant]
        );

        const sizes = ImageStore.getFileSizeSums(fileList);

        return `${getFileSizeLabel(
            sizes[variant], (value) => this.decimalPipe.transform(value)
        )}`;
    }


    private static async getFileCount(fileInfos: Map<FileInfo>, variant: ImageVariant): Promise<number> {

        return Object.values(fileInfos).filter(fileInfo => {
            return !fileInfo.deleted
                && (!fileInfo.useOriginalForDisplay || variant !== ImageVariant.DISPLAY)
                && fileInfo.variants.filter(v => v.name === variant).length === 1;
        }).length;
    }


    private getProjectResourceValue(fieldName: string): string|undefined {

        return getKoreanFieldworkProjectResourceValue(this.projectDocument, fieldName);
    }


    private setKoreanProjectSetupFieldsFromDocument() {

        this.koreanInvestigationMode = this.getProjectResourceValue(KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD)
            ?? KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE;
        this.koreanBoundarySummary = this.getKoreanBoundarySummary();
    }


    private async updateKoreanFieldworkSummary() {

        if (!this.isKoreanFieldworkProject()) {
            this.koreanTodayStats = undefined;
            this.koreanWorkflowSteps = [];
            this.koreanNotebookDigest = undefined;
            return;
        }

        try {
            const documents = (await this.datastore.find({})).documents ?? [];
            this.koreanTodayStats = makeKoreanFieldworkTodayStats(documents);
            this.koreanNotebookDigest = makeKoreanFieldworkDailyNotebookDigest(documents);
            this.koreanWorkflowSteps = makeKoreanFieldworkWorkflowSteps(
                documents,
                this.projectDocument,
                this.koreanTodayStats
            );
        } catch (_) {
            this.koreanTodayStats = undefined;
            this.koreanWorkflowSteps = [];
            this.koreanNotebookDigest = undefined;
        }
    }

}
