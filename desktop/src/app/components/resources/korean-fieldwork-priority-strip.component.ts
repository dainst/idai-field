import { Component, OnDestroy, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
    Datastore,
    Document,
    FieldDocument,
    KoreanFieldworkReadinessIssue,
    PouchdbDatastore,
    ProjectConfiguration
} from 'idai-field-core';
import { Routing } from '../../services/routing';
import { MenuModalLauncher } from '../../services/menu-modal-launcher';
import { Messages } from '../messages/messages';
import { ViewFacade } from './view/view-facade';
import {
    getKoreanFieldworkProjectResourceValue,
    isKoreanFieldworkProject,
    KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD,
    KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
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
    KoreanFieldworkProgressItem,
    makeKoreanFieldworkProgressItems
} from '../../util/korean-fieldwork-progress-board';
import {
    KoreanFieldworkFeatureOverviewItem,
    KoreanFieldworkUnitMatrixItem,
    makeKoreanFieldworkFeatureOverviewItems,
    makeKoreanFieldworkUnitMatrixItems
} from '../../util/korean-fieldwork-unit-matrix';
import {
    KoreanFieldworkDailyNotebookDigest,
    KoreanFieldworkNotebookEntry,
    KoreanFieldworkNotebookContinuationFocus,
    getKoreanFieldworkNotebookContinuationSeed,
    getKoreanFieldworkNotebookEntriesForDocument,
    makeKoreanFieldworkDailyNotebookDigest
} from '../../util/korean-fieldwork-notebook-digest';
import {
    KoreanFieldworkWorkbenchItem,
    makeKoreanFieldworkWorkbenchItems
} from '../../util/korean-fieldwork-workbench';
import {
    isKoreanFieldworkHierarchyScopeDocument,
    KoreanFieldworkHierarchyItem,
    KoreanFieldworkHierarchyLane,
    makeKoreanFieldworkHierarchyLanes
} from '../../util/korean-fieldwork-hierarchy';
import {
    KoreanFieldworkPriorityTask,
    KoreanFieldworkPriorityTaskAction,
    makeKoreanFieldworkPriorityTasks
} from '../../util/korean-fieldwork-today-actions';
import {
    KoreanFieldworkRecordActionItem,
    makeKoreanFieldworkRecordActions
} from '../../util/korean-fieldwork-record-actions';
import {
    canReviseKoreanFieldworkIdentifier,
    getKoreanFieldworkFieldIdentifier,
    getKoreanFieldworkIdentifierRevisionHistory,
    getKoreanFieldworkIdentifierRevisionUpdates,
    getKoreanFieldworkReportIdentifier
} from '../../util/korean-fieldwork-identifier-revision';
import {
    getKoreanFieldworkRecordWorkDocuments,
    getKoreanFieldworkRecordWorkFilterCounts,
    KOREAN_FIELDWORK_RECORD_WORK_FILTERS,
    KoreanFieldworkRecordWorkFilter,
    KoreanFieldworkRecordWorkFilterCounts,
    KoreanFieldworkRecordWorkFilterId,
    matchesKoreanFieldworkRecordWorkFilter
} from '../../util/korean-fieldwork-record-work-filters';
import {
    KoreanFieldworkCloseoutSummary,
    makeKoreanFieldworkCloseoutSummary
} from '../../util/korean-fieldwork-closeout';
import {
    KoreanFieldworkScopeSummary,
    KoreanFieldworkScopeSummaryAction,
    makeKoreanFieldworkScopeSummary
} from '../../util/korean-fieldwork-scope-summary';
import {
    getKoreanFieldworkCloseoutBatchUpdates,
    getKoreanFieldworkCloseoutIssueActions,
    KoreanFieldworkCloseoutBatchUpdate
} from '../../util/korean-fieldwork-closeout-actions';
import {
    canCreateKoreanFieldworkChildRecord,
    createKoreanFieldworkDraftResource,
    getKoreanFieldworkContinuationActions
} from '../../util/korean-fieldwork-document-drafts';
import {
    KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS,
    KoreanFieldworkFeatureGuidancePreset
} from '../../util/korean-fieldwork-feature-guidance';
import { DoceditLauncher } from './service/docedit-launcher';

type KoreanFieldworkPriorityPanelId = 'workflow'|'today'|'records'|'notebook'|'closeout';

interface KoreanFieldworkPriorityPanelOption {
    id: KoreanFieldworkPriorityPanelId;
    label: string;
    count: number;
}

interface KoreanFieldworkRecordWorkEmptyState {
    title: string;
    detail: string;
}

interface PendingFeatureDraft {
    parentDocumentId: string;
    parentLabel: string;
}

interface KoreanFieldworkCreateDocumentDraftOptions {
    recordMemoContinuation?: ReturnType<typeof getKoreanFieldworkNotebookContinuationSeed>;
    recordMemoTemplate?: boolean;
}

type KoreanFieldworkTodayQuickActionId = 'dailyLog'|'record'|'closeout';
type KoreanFieldworkTodayQuickActionTone = 'neutral'|'success'|'info'|'warning'|'danger';

type KoreanFieldworkTodayQuickActionTarget =
    | { type: 'dailyLog' }
    | { type: 'priorityTask', action: KoreanFieldworkPriorityTaskAction }
    | { type: 'openPanel', panelId: KoreanFieldworkPriorityPanelId };

interface KoreanFieldworkTodayQuickAction {
    id: KoreanFieldworkTodayQuickActionId;
    icon: string;
    label: string;
    detail: string;
    tone: KoreanFieldworkTodayQuickActionTone;
    target?: KoreanFieldworkTodayQuickActionTarget;
    disabled?: boolean;
}

const FEATURE_CATEGORY_NAME = 'Feature';
const NOTEBOOK_RECORD_MEMO_CATEGORY = 'PenMemo';
const NOTEBOOK_RECORD_MEMO_TARGET_CATEGORIES = new Set([
    'Operation',
    'Trench',
    'FeatureGroup',
    'Feature',
    'FeatureSegment',
    'Layer',
    'FindCollection',
    'Find',
    'Sample',
    'Photo',
    'SoilProfilePhoto',
    'Drawing'
]);

const SELECTED_RECORD_CATEGORY_LABELS: Readonly<Record<string, string>> = {
    Drawing: '도면',
    Feature: '유구',
    FeatureGroup: '유구군',
    FeatureSegment: '세부 단위',
    Find: '유물',
    FindCollection: '유물 일괄',
    Layer: '토층',
    Operation: '조사',
    Photo: '사진',
    Sample: '시료',
    SoilProfilePhoto: '토층사진',
    Trench: '트렌치'
};


@Component({
    selector: 'korean-fieldwork-priority-strip',
    templateUrl: './korean-fieldwork-priority-strip.html',
    standalone: false
})
export class KoreanFieldworkPriorityStripComponent implements OnInit, OnDestroy {

    public stats: KoreanFieldworkTodayStats|undefined;
    public workflowSteps: KoreanFieldworkWorkflowStep[] = [];
    public priorityTasks: KoreanFieldworkPriorityTask[] = [];
    public progressItems: KoreanFieldworkProgressItem[] = [];
    public featureOverviewItems: KoreanFieldworkFeatureOverviewItem[] = [];
    public unitMatrixItems: KoreanFieldworkUnitMatrixItem[] = [];
    public workbenchItems: KoreanFieldworkWorkbenchItem[] = [];
    public recordWorkFilterCounts: KoreanFieldworkRecordWorkFilterCounts|undefined;
    public activeRecordWorkFilterId: KoreanFieldworkRecordWorkFilterId = 'all';
    public workbenchActionsByDocumentId: Map<string, KoreanFieldworkRecordActionItem[]> = new Map();
    public scopeSummary: KoreanFieldworkScopeSummary|undefined;
    public closeoutSummary: KoreanFieldworkCloseoutSummary|undefined;
    public closeoutBatchUpdates: KoreanFieldworkCloseoutBatchUpdate[] = [];
    public notebookDigest: KoreanFieldworkDailyNotebookDigest|undefined;
    public notebookDailyLogParentDocumentId: string|undefined;
    public isLoading: boolean = false;
    public activePanel: KoreanFieldworkPriorityPanelId = 'workflow';
    public pendingFeatureDraft: PendingFeatureDraft|undefined;

    private changesSubscription: Subscription|undefined;
    private refreshId: number = 0;
    private projectDocuments: Document[] = [];


    constructor(private datastore: Datastore,
                private pouchdbDatastore: PouchdbDatastore,
                private projectConfiguration: ProjectConfiguration,
                private routing: Routing,
                private viewFacade: ViewFacade,
                private menuModalLauncher: MenuModalLauncher,
                private router: Router,
                private messages: Messages,
                @Optional() private doceditLauncher?: DoceditLauncher) {}


    async ngOnInit() {

        await this.refresh();
        this.changesSubscription = this.pouchdbDatastore.changesNotifications().subscribe(() => {
            this.refresh();
        });
    }


    ngOnDestroy() {

        if (this.changesSubscription) this.changesSubscription.unsubscribe();
    }


    public shouldShow = () => this.stats !== undefined;

    public setActivePanel(panelId: KoreanFieldworkPriorityPanelId) {

        if (this.isPanelAvailable(panelId)) this.activePanel = panelId;
    }

    public isPanelActive = (panelId: KoreanFieldworkPriorityPanelId) =>
        this.activePanel === panelId;

    public getPanelOptions(): KoreanFieldworkPriorityPanelOption[] {

        const panels: KoreanFieldworkPriorityPanelOption[] = [
            { id: 'workflow', label: '작업 순서', count: this.getWorkflowStepAttentionCount() },
            { id: 'today', label: '오늘 할 일', count: this.getTodayPanelCount() },
            { id: 'records', label: '기록 작업', count: this.getRecordsPanelCount() },
            { id: 'notebook', label: '야장', count: this.getNotebookPanelCount() },
            { id: 'closeout', label: '마감', count: this.getCloseoutPanelCount() }
        ];

        return panels.filter(panel => this.isPanelAvailable(panel.id));
    }

    public shouldShowPanelNavigation = () =>
        this.getPanelOptions().length > 1;

    public hasPriorityIssues = () => this.getPriorityIssues().length > 0;

    public getPriorityIssues = () =>
        this.stats?.priorityIssues ?? [];

    public getSummaryLabel = () => {
        if (!this.stats) return '';

        return `일지 ${this.stats.dailyLogCount} · 경계 ${this.stats.surveyBoundaryCount} · 유구 후보 ${this.stats.featureCandidateCount} · 확인 ${this.stats.openIssueCount}`;
    };

    public getIssueBreakdownLabel = () => {
        if (!this.stats || this.stats.openIssueCount === 0) return '우선 확인 없음';

        return `필수 ${this.stats.criticalIssueCount} · 보완 ${this.stats.warningIssueCount} · 참고 ${this.stats.infoIssueCount}`;
    };

    public getStatusLabel = () => this.stats?.statusLabel ?? '';

    public getStatusTone = () => this.stats?.statusTone ?? 'success';

    public hasScopeSummary = () => this.scopeSummary !== undefined;

    public getScopeSummary = () => this.scopeSummary;

    public getScopeMetricLabel = () => {
        if (!this.scopeSummary) return '';

        return `현장 기록 ${this.scopeSummary.structureCount} · 자료 ${this.scopeSummary.evidenceCount} · 일지·점검 ${this.scopeSummary.reviewCount} · 확인 ${this.scopeSummary.issueCount}`;
    };

    public hasCloseoutSummary = () => this.closeoutSummary !== undefined;

    public getCloseoutSummary = () => this.closeoutSummary;

    public getCloseoutIssues = () => this.closeoutSummary?.issues ?? [];

    public getCloseoutCountsLabel = () => {
        const counts = this.closeoutSummary?.counts;
        if (!counts) return '';

        return `필수 ${counts.critical} · 보완 ${counts.warning} · 참고 ${counts.info}`;
    };

    public hasCloseoutBatchUpdates = () => this.closeoutBatchUpdates.length > 0;

    public getCloseoutBatchUpdateCount = () =>
        this.closeoutBatchUpdates.reduce((count, update) => count + update.issueCount, 0);

    public getCloseoutBatchDocumentCount = () => this.closeoutBatchUpdates.length;

    public getWorkflowSteps = () => this.workflowSteps;

    public getPriorityTasks = () => this.priorityTasks;

    public hasPriorityTasks = () => this.priorityTasks.length > 0;

    public getTodayQuickActions = (): KoreanFieldworkTodayQuickAction[] => [
        this.getTodayDailyLogQuickAction(),
        this.getTodayRecordQuickAction(),
        this.getTodayCloseoutQuickAction()
    ];

    public getProgressItems = () => this.progressItems;

    public hasProgressItems = () => this.progressItems.length > 0;

    public getFeatureOverviewItems = () => this.featureOverviewItems;

    public hasFeatureOverviewItems = () => this.featureOverviewItems.length > 0;

    public getUnitMatrixItems = () => this.unitMatrixItems;

    public hasUnitMatrixItems = () => this.unitMatrixItems.length > 0;

    public hasWorkbenchItems = () => this.workbenchItems.length > 0;

    public getWorkbenchItems = () => this.workbenchItems;

    public getFilteredWorkbenchItems = () =>
        this.workbenchItems.filter(item => this.matchesActiveRecordWorkFilter(item.documentId));

    public hasFilteredWorkbenchItems = () =>
        this.getFilteredWorkbenchItems().length > 0;

    public getHierarchyLanes = (): KoreanFieldworkHierarchyLane[] =>
        this.stats
            ? makeKoreanFieldworkHierarchyLanes(
                this.projectDocuments,
                this.stats.issueCountByDocumentId,
                this.getHierarchyScopeDocument()
            )
            : [];

    public hasHierarchyLanes = () =>
        this.getHierarchyLanes().some(lane => lane.totalCount > 0);

    public getHierarchyScopeLabel = () => {
        const scopeDocument = this.getHierarchyScopeDocument();

        return scopeDocument?.resource.identifier
            ?? scopeDocument?.resource.id
            ?? '전체 조사자료';
    };

    public getHierarchyItemContinuationAction(item: KoreanFieldworkHierarchyItem) {

        const document = this.getDocumentById(item.documentId);
        if (!document) return undefined;

        return getKoreanFieldworkContinuationActions(document, this.projectConfiguration)[0];
    }

    public canCreateHierarchyItemChild = (item: KoreanFieldworkHierarchyItem) =>
        this.getHierarchyItemContinuationAction(item) !== undefined;

    public getWorkbenchActions = (item: KoreanFieldworkWorkbenchItem) =>
        this.workbenchActionsByDocumentId.get(item.documentId) ?? [];

    public getRecordWorkFilters = (): readonly KoreanFieldworkRecordWorkFilter[] =>
        KOREAN_FIELDWORK_RECORD_WORK_FILTERS;

    public getRecordWorkFilterCount = (filter: KoreanFieldworkRecordWorkFilter) =>
        this.recordWorkFilterCounts?.[filter.id] ?? 0;

    public setActiveRecordWorkFilter(filter: KoreanFieldworkRecordWorkFilter) {

        this.activeRecordWorkFilterId = filter.id;
    }

    public isRecordWorkFilterActive = (filter: KoreanFieldworkRecordWorkFilter) =>
        this.activeRecordWorkFilterId === filter.id;

    public hasRecordWorkFilterCounts = () =>
        this.recordWorkFilterCounts !== undefined
        && this.recordWorkFilterCounts.all > 0;

    public hasFilteredRecordWorkItems = () =>
        this.getFilteredFeatureOverviewItems().length > 0
        || this.getFilteredUnitMatrixItems().length > 0
        || this.getFilteredProgressItems().length > 0
        || this.getFilteredWorkbenchItems().length > 0;

    public hasPendingFeatureDraft = () =>
        this.isPanelActive('records') && this.pendingFeatureDraft !== undefined;

    public getPendingFeatureDraftParentLabel = () =>
        this.pendingFeatureDraft?.parentLabel ?? '선택 기록';

    public getFeatureDraftPresets = (): readonly KoreanFieldworkFeatureGuidancePreset[] =>
        KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS;

    public getFeatureDraftPresetLabel(preset: KoreanFieldworkFeatureGuidancePreset): string {

        return preset.featureType === 'unknown'
            ? '유구로 만들기'
            : preset.label;
    }

    public cancelPendingFeatureDraft(event?: Event) {

        if (event) event.stopPropagation();
        this.pendingFeatureDraft = undefined;
    }

    public getFilteredRecordWorkEmptyState = (): KoreanFieldworkRecordWorkEmptyState => {

        switch (this.activeRecordWorkFilterId) {
            case 'needsReview':
                return {
                    title: '확인 필요 기록이 없습니다',
                    detail: '보완 경고나 재확인 표시가 있는 기록이 이 필터에 없습니다.'
                };
            case 'pending':
                return {
                    title: '조사 중 기록이 없습니다',
                    detail: '성격 보류나 조사 중 상태로 남겨 둔 유구 기록이 없습니다.'
                };
            case 'missingEvidence':
                return {
                    title: '자료 보강 대상이 없습니다',
                    detail: '사진·도면·유물·시료 연결이 부족한 기록이 이 필터에 없습니다.'
                };
            case 'today':
                return {
                    title: '오늘 작성 기록이 없습니다',
                    detail: '오늘 작성 필터만 비어 있습니다. 전체를 누르면 기존 기록을 다시 볼 수 있습니다.'
                };
            default:
                return {
                    title: '표시할 기록 작업이 없습니다',
                    detail: '조사 구역·트렌치·유구를 추가하거나 다른 작업 필터를 확인하세요.'
                };
        }
    };

    public getFilteredRecordWorkEmptyLabel = () =>
        this.getFilteredRecordWorkEmptyState().title;

    public getFilteredProgressItems = () =>
        this.progressItems.filter(item => this.matchesActiveRecordWorkFilter(item.documentId));

    public hasFilteredProgressItems = () =>
        this.getFilteredProgressItems().length > 0;

    public getFilteredFeatureOverviewItems = () =>
        this.featureOverviewItems.filter(item => this.matchesActiveRecordWorkFilter(item.documentId));

    public hasFilteredFeatureOverviewItems = () =>
        this.getFilteredFeatureOverviewItems().length > 0;

    public getFilteredUnitMatrixItems = () =>
        this.unitMatrixItems.filter(item => this.matchesActiveRecordWorkFilter(item.documentId));

    public hasFilteredUnitMatrixItems = () =>
        this.getFilteredUnitMatrixItems().length > 0;

    public hasSelectedRecordWorkbench = () =>
        !!this.stats && !!this.getSelectedRecordWorkbenchDocument();

    public getSelectedRecordWorkbenchLabel = () => {
        const selectedDocument = this.getSelectedRecordWorkbenchDocument();

        return selectedDocument?.resource.identifier
            ?? selectedDocument?.resource.id
            ?? '';
    };

    public getSelectedRecordWorkbenchCategoryLabel = () => {
        const selectedDocument = this.getSelectedRecordWorkbenchDocument();
        if (!selectedDocument?.resource?.category) return '';

        return SELECTED_RECORD_CATEGORY_LABELS[selectedDocument.resource.category]
            ?? selectedDocument.resource.category;
    };

    public getSelectedRecordWorkbenchActions = () => {
        const selectedDocument = this.getSelectedRecordWorkbenchDocument();
        if (!selectedDocument) return [];

        return makeKoreanFieldworkRecordActions(
            selectedDocument,
            this.projectDocuments,
            this.projectConfiguration,
            4
        );
    };

    public canReviseSelectedRecordIdentifier = () =>
        canReviseKoreanFieldworkIdentifier(this.getSelectedRecordWorkbenchDocument());

    public getSelectedRecordFieldIdentifier = () => {
        const selectedDocument = this.getSelectedRecordWorkbenchDocument();

        return selectedDocument
            ? getKoreanFieldworkFieldIdentifier(selectedDocument)
            : '';
    };

    public getSelectedRecordReportIdentifier = () => {
        const selectedDocument = this.getSelectedRecordWorkbenchDocument();

        return selectedDocument
            ? getKoreanFieldworkReportIdentifier(selectedDocument)
            : '';
    };

    public getSelectedRecordIdentifierRevisionHistoryLabel = () => {
        const selectedDocument = this.getSelectedRecordWorkbenchDocument();
        if (!selectedDocument) return '변경 이력 없음';

        const history = getKoreanFieldworkIdentifierRevisionHistory(selectedDocument);
        if (history.length === 0) return '변경 이력 없음';

        const latestEntry = history[history.length - 1];

        return `이력 ${history.length} · 최근 ${latestEntry.previousIdentifier}에서 ${latestEntry.nextIdentifier}`;
    };

    public canApplySelectedRecordIdentifierRevision = (nextIdentifier: string|undefined|null) => {
        const selectedDocument = this.getSelectedRecordWorkbenchDocument();
        if (!selectedDocument || !canReviseKoreanFieldworkIdentifier(selectedDocument)) return false;

        const normalizedNextIdentifier = normalizeIdentifierInput(nextIdentifier);
        const currentIdentifier = normalizeIdentifierInput(selectedDocument.resource.identifier);

        return !!normalizedNextIdentifier && normalizedNextIdentifier !== currentIdentifier;
    };

    public hasNotebookDigest = () =>
        !!this.notebookDigest
        && (
            this.notebookDigest.entries.length > 0
            || this.notebookDigest.dailyLogDocuments.length > 0
        );

    public hasNotebookPanel = () =>
        !!this.stats
        && (
            this.hasNotebookDigest()
            || this.hasNotebookSelectedRecordEntries()
            || this.canRunNotebookDailyLogAction()
            || this.canRunNotebookRecordMemoAction()
        );

    public getNotebookSummaryLabel = () => {
        const selectedRecordEntryCount = this.getNotebookSelectedRecordEntries().length;
        if (!this.notebookDigest) return '오늘 작업일지 준비 필요';

        return `기록 ${this.notebookDigest.entries.length}`
            + ` · 다음 ${this.notebookDigest.nextWorkEntries.length}`
            + ` · 번호 ${this.notebookDigest.evidenceMissingEntries.length}`
            + (selectedRecordEntryCount ? ` · 선택 ${selectedRecordEntryCount}` : '');
    };

    public getNotebookNextWorkEntries = () =>
        this.notebookDigest?.nextWorkEntries.slice(0, 3) ?? [];

    public getNotebookEvidenceMissingEntries = () =>
        this.notebookDigest?.evidenceMissingEntries.slice(0, 3) ?? [];

    public getNotebookRecentEntries = () => {
        if (!this.notebookDigest) return [];

        const surfacedEntryIds = new Set([
            ...this.notebookDigest.nextWorkEntries,
            ...this.notebookDigest.evidenceMissingEntries,
            ...this.getNotebookSelectedRecordEntries()
        ].map(entry => entry.id));

        return this.notebookDigest.entries
            .filter(entry => !surfacedEntryIds.has(entry.id))
            .slice(0, 3);
    };

    public hasNotebookRecentEntries = () =>
        this.getNotebookRecentEntries().length > 0;

    public hasNotebookFollowUps = () =>
        this.getNotebookNextWorkEntries().length > 0
        || this.getNotebookEvidenceMissingEntries().length > 0;

    public getNotebookSelectedRecordEntries = () =>
        getKoreanFieldworkNotebookEntriesForDocument(
            this.getNotebookSelectedRecordDocument(),
            this.projectDocuments,
            3
        );

    public hasNotebookSelectedRecordEntries = () =>
        this.getNotebookSelectedRecordEntries().length > 0;

    public getNotebookSelectedRecordLabel = () => {
        const selectedDocument = this.getNotebookSelectedRecordDocument();

        return selectedDocument?.resource.identifier
            ?? selectedDocument?.resource.id
            ?? '선택 기록';
    };

    public getNotebookEntryActionLabel(entry: KoreanFieldworkNotebookEntry): string {

        return entry.targetDocument ? '대상 열기' : `${entry.sourceLabel} 열기`;
    }

    public getNotebookContinuationFocus(
            entry: KoreanFieldworkNotebookEntry,
            preferredFocus?: KoreanFieldworkNotebookContinuationFocus
    ): KoreanFieldworkNotebookContinuationFocus|undefined {

        if (preferredFocus) return preferredFocus;
        if (entry.needsEvidenceNumbers && !entry.nextWork) return 'evidenceNumbers';
        if (entry.nextWork) return 'nextWork';

        return undefined;
    }

    public getNotebookContinuationActionLabel(
            entry: KoreanFieldworkNotebookEntry,
            preferredFocus?: KoreanFieldworkNotebookContinuationFocus
    ): string {

        const focus = this.getNotebookContinuationFocus(entry, preferredFocus);
        if (focus === 'evidenceNumbers') return '번호 이어쓰기';
        if (focus === 'nextWork') return '다음 이어쓰기';

        return '이어쓰기';
    }

    public canContinueNotebookEntry(
            entry: KoreanFieldworkNotebookEntry,
            preferredFocus?: KoreanFieldworkNotebookContinuationFocus
    ): boolean {

        const parentDocument = this.getNotebookContinuationParentDocument(entry);
        const penMemoCategory = getCategory(NOTEBOOK_RECORD_MEMO_CATEGORY, this.projectConfiguration);

        return !!parentDocument
            && !!penMemoCategory
            && canCreateKoreanFieldworkChildRecord(
                penMemoCategory,
                parentDocument,
                this.projectConfiguration
            )
            && !!getKoreanFieldworkNotebookContinuationSeed(
                entry,
                this.getNotebookContinuationFocus(entry, preferredFocus)
            );
    }

    public canRunNotebookDailyLogAction = () =>
        !!this.notebookDigest?.primaryDailyLog || !!this.notebookDailyLogParentDocumentId;

    public getNotebookDailyLogActionLabel = () =>
        this.notebookDigest?.primaryDailyLog ? '오늘 작업일지 열기' : '오늘 작업일지 만들기';

    public getNotebookDailyLogActionDetail = () =>
        this.notebookDigest?.primaryDailyLog
            ? '오늘 작업일지 기록을 엽니다.'
            : '현재 조사 구역에 오늘 작업일지를 만듭니다.';

    public canRunNotebookRecordMemoAction = () =>
        !!this.getNotebookRecordMemoParentDocument();

    public getNotebookRecordMemoActionLabel = () => '선택 기록 메모';

    public getNotebookRecordMemoActionDetail = () => {
        const selectedDocument = this.getNotebookRecordMemoParentDocument();
        const selectedLabel = selectedDocument?.resource.identifier
            ?? selectedDocument?.resource.id;

        return selectedLabel
            ? `${selectedLabel}에 현장 메모를 붙입니다.`
            : '지도나 기록 목록에서 선택한 기록에 현장 메모를 붙입니다.';
    };

    public canRunWorkflowStep = (step: KoreanFieldworkWorkflowStep) => !!step.action;

    public canRunWorkflowStepSecondaryAction = (step: KoreanFieldworkWorkflowStep) => !!step.secondaryAction;

    public getWorkflowStepStatusLabel(status: KoreanFieldworkWorkflowStep['status']): string {

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

    public getSeverityLabel(severity: KoreanFieldworkPriorityIssue['severity']): string {

        switch (severity) {
            case 'critical':
                return '필수';
            case 'warning':
                return '보완';
            case 'info':
                return '참고';
        }
    }


    public async openIssue(issue: KoreanFieldworkPriorityIssue) {

        try {
            await this.openDocument(issue.documentId);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openCloseoutIssue(issue: KoreanFieldworkReadinessIssue) {

        try {
            await this.openDocument(issue.documentId);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async resolveCloseoutBatchUpdates() {

        if (!this.hasCloseoutBatchUpdates()) return;

        try {
            const updatedDocuments = this.closeoutBatchUpdates.map(batchUpdate => {
                const document = Document.clone(batchUpdate.document);
                Object.entries(batchUpdate.updates).forEach(([fieldName, value]) => {
                    document.resource[fieldName] = value;
                });
                return document;
            });

            await this.datastore.bulkUpdate(updatedDocuments);
            await this.refresh();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async runWorkflowStep(step: KoreanFieldworkWorkflowStep) {

        if (!step.action) return;

        try {
            await this.runWorkflowAction(step.action);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async runWorkflowStepSecondaryAction(step: KoreanFieldworkWorkflowStep) {

        if (!step.secondaryAction) return;

        try {
            await this.runWorkflowAction(step.secondaryAction);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async runScopeSummaryAction(action: KoreanFieldworkScopeSummaryAction|undefined) {

        if (!action) return;

        try {
            await this.runWorkflowAction(action);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async runPriorityTask(task: KoreanFieldworkPriorityTask) {

        try {
            await this.runPriorityTaskAction(task.action);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public canRunPriorityTaskSecondaryAction = (task: KoreanFieldworkPriorityTask) =>
        !!task.secondaryAction;

    public async runPriorityTaskSecondaryAction(task: KoreanFieldworkPriorityTask) {

        if (!task.secondaryAction) return;

        try {
            await this.runPriorityTaskAction(task.secondaryAction);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async runTodayQuickAction(action: KoreanFieldworkTodayQuickAction) {

        if (action.disabled || !action.target) return;

        try {
            switch (action.target.type) {
                case 'dailyLog':
                    await this.runNotebookDailyLogAction();
                    return;
                case 'priorityTask':
                    await this.runPriorityTaskAction(action.target.action);
                    return;
                case 'openPanel':
                    this.setActivePanel(action.target.panelId);
                    return;
            }
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openProgressItem(item: KoreanFieldworkProgressItem) {

        try {
            await this.openDocument(item.documentId);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openUnitMatrixItem(item: KoreanFieldworkUnitMatrixItem) {

        try {
            await this.openDocument(item.documentId);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async createUnitMatrixRecord(item: KoreanFieldworkUnitMatrixItem,
                                        categoryName: string,
                                        event?: Event) {

        if (event) event.stopPropagation();

        try {
            if (await this.requestDocumentDraft(item.documentId, categoryName)) {
                await this.refresh();
            }
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openWorkbenchItem(item: KoreanFieldworkWorkbenchItem) {

        try {
            await this.openDocument(item.documentId);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async runWorkbenchAction(item: KoreanFieldworkWorkbenchItem,
                                    action: KoreanFieldworkRecordActionItem,
                                    event?: Event) {

        if (event) event.stopPropagation();

        try {
            switch (action.type) {
                case 'openDocument':
                    await this.openDocument(action.documentId ?? item.documentId);
                    return;
                case 'createDocument':
                    if (!action.categoryName) return;
                    if (await this.requestDocumentDraft(item.documentId, action.categoryName)) {
                        await this.refresh();
                    }
                    return;
            }
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async openSelectedRecordWorkbenchDocument(event?: Event) {

        if (event) event.stopPropagation();

        const selectedDocument = this.getSelectedRecordWorkbenchDocument();
        if (!selectedDocument) return;

        try {
            await this.routing.jumpToResource(selectedDocument);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openSelectedRecordWorkbenchOnMap(event?: Event) {

        if (event) event.stopPropagation();

        try {
            this.viewFacade.setMode('map');
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async clearSelectedRecordWorkbench(event?: Event) {

        if (event) event.stopPropagation();

        try {
            await this.viewFacade.deselect();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openHierarchyItem(item: KoreanFieldworkHierarchyItem, event?: Event) {

        if (event) event.stopPropagation();

        try {
            await this.openDocument(item.documentId);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async createHierarchyItemChild(item: KoreanFieldworkHierarchyItem, event?: Event) {

        if (event) event.stopPropagation();

        const action = this.getHierarchyItemContinuationAction(item);
        if (!action) return;

        try {
            if (await this.requestDocumentDraft(item.documentId, action.categoryName)) {
                await this.refresh();
            }
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async runSelectedRecordWorkbenchAction(action: KoreanFieldworkRecordActionItem,
                                                  event?: Event) {

        if (event) event.stopPropagation();

        const selectedDocument = this.getSelectedRecordWorkbenchDocument();
        if (!selectedDocument) return;

        try {
            switch (action.type) {
                case 'openDocument':
                    await this.openDocument(action.documentId ?? selectedDocument.resource.id);
                    return;
                case 'createDocument':
                    if (!action.categoryName) return;
                    if (await this.requestDocumentDraft(selectedDocument.resource.id, action.categoryName)) {
                        await this.refresh();
                    }
                    return;
            }
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async createPendingFeatureDraft(preset: KoreanFieldworkFeatureGuidancePreset,
                                           event?: Event) {

        if (event) event.stopPropagation();
        const pendingFeatureDraft = this.pendingFeatureDraft;
        if (!pendingFeatureDraft) return;

        try {
            this.pendingFeatureDraft = undefined;
            await this.createDocumentDraft(
                pendingFeatureDraft.parentDocumentId,
                FEATURE_CATEGORY_NAME,
                preset.featureType
            );
            await this.refresh();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async applySelectedRecordIdentifierRevision(nextIdentifier: string|undefined|null,
                                                       reason?: string|undefined|null,
                                                       event?: Event) {

        if (event) event.stopPropagation();

        const selectedDocument = this.getSelectedRecordWorkbenchDocument();
        if (!selectedDocument || !this.canApplySelectedRecordIdentifierRevision(nextIdentifier)) return;

        try {
            const updates = getKoreanFieldworkIdentifierRevisionUpdates(selectedDocument, {
                nextIdentifier: nextIdentifier ?? '',
                reason: reason ?? ''
            });
            if (Object.keys(updates).length === 0) return;

            const updatedDocument = Document.clone(selectedDocument);
            Object.entries(updates).forEach(([fieldName, value]) => {
                updatedDocument.resource[fieldName] = value;
            });

            await this.datastore.bulkUpdate([updatedDocument]);
            this.projectDocuments = this.projectDocuments.map(document =>
                document.resource.id === updatedDocument.resource.id
                    ? updatedDocument
                    : document
            );
            await this.refresh();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async openNotebookEntry(entry: KoreanFieldworkNotebookEntry) {

        try {
            await this.routing.jumpToResource(entry.targetDocument ?? entry.sourceDocument);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async openNotebookEntrySource(entry: KoreanFieldworkNotebookEntry) {

        try {
            await this.routing.jumpToResource(entry.sourceDocument);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async continueNotebookEntry(
            entry: KoreanFieldworkNotebookEntry,
            preferredFocus?: KoreanFieldworkNotebookContinuationFocus,
            event?: Event) {

        if (event) event.stopPropagation();

        const parentDocument = this.getNotebookContinuationParentDocument(entry);
        if (!parentDocument?.resource?.id) return;

        try {
            await this.createDocumentDraft(
                parentDocument.resource.id,
                NOTEBOOK_RECORD_MEMO_CATEGORY,
                undefined,
                {
                    recordMemoContinuation: getKoreanFieldworkNotebookContinuationSeed(
                        entry,
                        this.getNotebookContinuationFocus(entry, preferredFocus)
                    )
                }
            );
            await this.refresh();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async runNotebookDailyLogAction() {

        try {
            if (this.notebookDigest?.primaryDailyLog) {
                await this.routing.jumpToResource(this.notebookDigest.primaryDailyLog);
            } else if (this.notebookDailyLogParentDocumentId) {
                await this.createDocumentDraft(this.notebookDailyLogParentDocumentId, 'DailyLog');
                await this.refresh();
            }
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }

    public async runNotebookRecordMemoAction() {

        const selectedDocument = this.getNotebookRecordMemoParentDocument();
        if (!selectedDocument?.resource?.id) return;

        try {
            await this.createDocumentDraft(
                selectedDocument.resource.id,
                NOTEBOOK_RECORD_MEMO_CATEGORY,
                undefined,
                { recordMemoTemplate: true }
            );
            await this.refresh();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async refresh() {

        const currentRefreshId = ++this.refreshId;
        this.isLoading = true;

        try {
            const documents: Document[] = (await this.datastore.find({})).documents ?? [];
            const projectDocument = documents.find(document => document.resource.id === 'project')
                ?? await this.datastore.get('project');

            const stats = isKoreanFieldworkProject(projectDocument, this.projectConfiguration)
                ? makeKoreanFieldworkTodayStats(documents)
                : undefined;
            const workflowSteps = stats
                ? makeKoreanFieldworkWorkflowSteps(documents, projectDocument, stats)
                : [];
            const scopeSummary = stats
                ? makeKoreanFieldworkScopeSummary(documents, projectDocument, stats.openIssueCount)
                : undefined;
            const priorityTasks = stats
                ? makeKoreanFieldworkPriorityTasks(documents, projectDocument, this.projectConfiguration)
                : [];
            const investigationMode = getKoreanFieldworkProjectResourceValue(
                projectDocument,
                KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
            );
            const progressItems = stats
                ? makeKoreanFieldworkProgressItems(documents, 6, investigationMode)
                : [];
            const featureOverviewItems = stats
                ? makeKoreanFieldworkFeatureOverviewItems(
                    documents,
                    projectDocument,
                    this.projectConfiguration
                )
                : [];
            const unitMatrixItems = stats
                ? makeKoreanFieldworkUnitMatrixItems(
                    documents,
                    projectDocument,
                    this.projectConfiguration
                )
                : [];
            const workbenchItems = stats
                ? makeKoreanFieldworkWorkbenchItems(documents)
                : [];
            const recordWorkFilterCounts = stats
                ? getKoreanFieldworkRecordWorkFilterCounts(
                    getKoreanFieldworkRecordWorkDocuments(documents),
                    documents,
                    stats.issueCountByDocumentId
                )
                : undefined;
            const documentsById = new Map(documents.map(document => [document.resource.id, document]));
            const workbenchActionsByDocumentId = stats
                ? makeWorkbenchActionsByDocumentId(workbenchItems, documentsById, documents, this.projectConfiguration)
                : new Map<string, KoreanFieldworkRecordActionItem[]>();
            const closeoutSummary = stats
                ? makeKoreanFieldworkCloseoutSummary(documents)
                : undefined;
            const closeoutBatchUpdates = stats
                ? makeCloseoutBatchUpdates(documents, documentsById, this.projectConfiguration)
                : [];
            const notebookDigest = stats
                ? makeKoreanFieldworkDailyNotebookDigest(documents)
                : undefined;
            const notebookDailyLogParentDocumentId = stats
                ? getNotebookDailyLogParentDocumentId(documents, this.projectConfiguration)
                : undefined;

            if (currentRefreshId === this.refreshId) {
                this.stats = stats;
                this.workflowSteps = workflowSteps;
                this.scopeSummary = scopeSummary;
                this.priorityTasks = priorityTasks;
                this.progressItems = progressItems;
                this.featureOverviewItems = featureOverviewItems;
                this.unitMatrixItems = unitMatrixItems;
                this.workbenchItems = workbenchItems;
                this.recordWorkFilterCounts = recordWorkFilterCounts;
                this.workbenchActionsByDocumentId = workbenchActionsByDocumentId;
                this.closeoutSummary = closeoutSummary;
                this.closeoutBatchUpdates = closeoutBatchUpdates;
                this.notebookDigest = notebookDigest;
                this.notebookDailyLogParentDocumentId = notebookDailyLogParentDocumentId;
                this.projectDocuments = documents;
                this.keepActivePanelAvailable();
            }
        } catch (_) {
            if (currentRefreshId === this.refreshId) {
                this.stats = undefined;
                this.workflowSteps = [];
                this.scopeSummary = undefined;
                this.priorityTasks = [];
                this.progressItems = [];
                this.featureOverviewItems = [];
                this.unitMatrixItems = [];
                this.workbenchItems = [];
                this.recordWorkFilterCounts = undefined;
                this.workbenchActionsByDocumentId = new Map();
                this.closeoutSummary = undefined;
                this.closeoutBatchUpdates = [];
                this.notebookDigest = undefined;
                this.notebookDailyLogParentDocumentId = undefined;
                this.projectDocuments = [];
                this.activePanel = 'workflow';
            }
        } finally {
            if (currentRefreshId === this.refreshId) this.isLoading = false;
        }
    }


    private async runWorkflowAction(action: KoreanFieldworkWorkflowAction) {

        switch (action.type) {
            case 'openProjectInfo':
                await this.menuModalLauncher.openInformationModal();
                await this.refresh();
                return;
            case 'openMap':
                await this.viewFacade.deselect();
                this.viewFacade.setMode('map');
                return;
            case 'openImport':
                await this.router.navigate(['import']);
                return;
            case 'openDocument':
                await this.openDocument(action.documentId);
                return;
        }
    }


    private async runPriorityTaskAction(action: KoreanFieldworkPriorityTaskAction) {

        switch (action.type) {
            case 'openProjectInfo':
                await this.menuModalLauncher.openInformationModal();
                await this.refresh();
                return;
            case 'openMap':
                await this.viewFacade.deselect();
                this.viewFacade.setMode('map');
                return;
            case 'openImport':
                await this.router.navigate(['import']);
                return;
            case 'openDocument':
                await this.openDocument(action.documentId);
                return;
            case 'createDocument':
                if (await this.requestDocumentDraft(action.parentDocumentId, action.categoryName)) {
                    await this.refresh();
                }
                return;
        }
    }


    private async requestDocumentDraft(parentDocumentId: string, categoryName: string): Promise<boolean> {

        if (categoryName === FEATURE_CATEGORY_NAME) {
            this.pendingFeatureDraft = {
                parentDocumentId,
                parentLabel: this.getDocumentLabel(parentDocumentId)
            };
            this.activePanel = 'records';
            return false;
        }

        await this.createDocumentDraft(parentDocumentId, categoryName);
        return true;
    }


    private async createDocumentDraft(parentDocumentId: string,
                                      categoryName: string,
                                      featureType?: string,
                                      options: KoreanFieldworkCreateDocumentDraftOptions = {}) {

        const parentDocument = await this.datastore.get(parentDocumentId);
        const draftResource = createKoreanFieldworkDraftResource(
            parentDocument,
            categoryName,
            this.projectConfiguration,
            {
                boundarySummary: this.getProjectBoundarySummaryDraftValue(categoryName),
                featureType,
                recordMemoContinuation: options.recordMemoContinuation,
                recordMemoTemplate: options.recordMemoTemplate
            }
        );
        const draftDocument = { resource: draftResource } as FieldDocument;

        if (this.doceditLauncher) {
            await this.doceditLauncher.editDocument(draftDocument);
        } else {
            await this.openDocument(parentDocument.resource.id);
        }
    }


    private getDocumentLabel(documentId: string): string {

        const document = this.projectDocuments.find(candidate =>
            candidate.resource.id === documentId
        );

        return document?.resource.identifier
            || document?.resource.id
            || '선택 기록';
    }


    private getProjectBoundarySummaryDraftValue(categoryName: string): string|undefined {

        if (categoryName !== 'SurveyBoundary') return undefined;

        const projectDocument = this.projectDocuments.find(candidate =>
            candidate.resource.category === 'Project'
        );

        return getKoreanFieldworkProjectResourceValue(
            projectDocument,
            KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD
        );
    }


    private async openDocument(documentId: string) {

        await this.routing.jumpToResource(await this.datastore.get(documentId));
    }


    private isPanelAvailable(panelId: KoreanFieldworkPriorityPanelId): boolean {

        switch (panelId) {
            case 'workflow':
                return this.workflowSteps.length > 0;
            case 'today':
                return this.hasPriorityIssues() || this.hasScopeSummary() || this.hasPriorityTasks();
            case 'records':
                return this.hasSelectedRecordWorkbench()
                    || this.hasHierarchyLanes()
                    || this.hasProgressItems()
                    || this.hasUnitMatrixItems()
                    || this.hasWorkbenchItems();
            case 'notebook':
                return this.hasNotebookPanel();
            case 'closeout':
                return this.hasCloseoutSummary();
        }
    }


    private keepActivePanelAvailable() {

        if (this.isPanelAvailable(this.activePanel)) return;

        this.activePanel = this.getPanelOptions()[0]?.id ?? 'workflow';
    }

    private getTodayDailyLogQuickAction(): KoreanFieldworkTodayQuickAction {

        const canRun = this.canRunNotebookDailyLogAction();

        return {
            id: 'dailyLog',
            icon: 'mdi-notebook-edit-outline',
            label: '오늘 일지',
            detail: canRun
                ? this.getNotebookDailyLogActionLabel()
                : '조사 경계가 생기면 일지를 만들 수 있습니다.',
            tone: canRun ? 'info' : 'neutral',
            target: canRun ? { type: 'dailyLog' } : undefined,
            disabled: !canRun
        };
    }


    private getTodayRecordQuickAction(): KoreanFieldworkTodayQuickAction {

        const featureCandidate = this.getFirstFeatureCandidateDocument();
        if (featureCandidate) {
            return {
                id: 'record',
                icon: 'mdi-map-marker-check-outline',
                label: '유구 확인',
                detail: `${this.getDocumentLabel(featureCandidate.resource.id)} 열기`,
                tone: 'info',
                target: {
                    type: 'priorityTask',
                    action: {
                        type: 'openDocument',
                        documentId: featureCandidate.resource.id
                    }
                }
            };
        }

        const task = this.getNextRecordPriorityTask();
        if (task) {
            return {
                id: 'record',
                icon: task.icon,
                label: task.actionLabel,
                detail: task.title,
                tone: task.tone,
                target: {
                    type: 'priorityTask',
                    action: task.action
                }
            };
        }

        return {
            id: 'record',
            icon: 'mdi-map-marker-plus-outline',
            label: '다음 기록',
            detail: '지금 바로 이어 만들 기록은 없습니다.',
            tone: 'neutral',
            disabled: true
        };
    }


    private getTodayCloseoutQuickAction(): KoreanFieldworkTodayQuickAction {

        const issueCount = this.getCloseoutIssues().length;
        const status = this.closeoutSummary?.status;

        return {
            id: 'closeout',
            icon: issueCount > 0 ? 'mdi-clipboard-alert-outline' : 'mdi-check-decagram-outline',
            label: '마감 점검',
            detail: this.closeoutSummary
                ? `${this.closeoutSummary.title} · ${issueCount}건`
                : '마감 상태를 계산할 수 없습니다.',
            tone: status === 'blocked'
                ? 'danger'
                : status === 'needsReview'
                    ? 'warning'
                    : status === 'clear'
                        ? 'success'
                        : 'neutral',
            target: this.closeoutSummary ? { type: 'openPanel', panelId: 'closeout' } : undefined,
            disabled: !this.closeoutSummary
        };
    }


    private getFirstFeatureCandidateDocument = () =>
        this.projectDocuments.find(document =>
            document.resource.category === FEATURE_CATEGORY_NAME
            && document.resource.featureRecordingStatus === 'candidate'
        );


    private getNextRecordPriorityTask(): KoreanFieldworkPriorityTask|undefined {

        const preferredTaskIds = [
            'create-survey-boundary',
            'create-detected-feature',
            'create-trench',
            'create-trench-pit',
            'create-excavation-section',
            'create-trench-profile-photo',
            'create-pit-profile-photo',
            'create-excavation-profile-photo',
            'create-excavation-drawing',
            'create-trench-photo'
        ];

        return preferredTaskIds
            .map(taskId => this.priorityTasks.find(task => task.id === taskId))
            .find((task): task is KoreanFieldworkPriorityTask => !!task)
            ?? this.priorityTasks.find(task =>
                task.action.type === 'createDocument'
                && task.id !== 'create-daily-log'
            );
    }


    private getWorkflowStepAttentionCount(): number {

        const openSteps = this.workflowSteps
            .filter(step => step.status === 'current' || step.status === 'attention' || step.status === 'todo')
            .length;

        return openSteps > 0 ? openSteps : this.workflowSteps.length;
    }


    private getTodayPanelCount = () =>
        this.getPriorityIssues().length
        + this.priorityTasks.length
        + (this.scopeSummary ? 1 : 0);


    private getRecordsPanelCount = () =>
        this.progressItems.length
        + this.featureOverviewItems.length
        + this.unitMatrixItems.length
        + this.workbenchItems.length
        + this.getHierarchyLanes().reduce((count, lane) => count + lane.totalCount, 0)
        + (this.hasSelectedRecordWorkbench()
            ? Math.max(1, this.getSelectedRecordWorkbenchActions().length)
            : 0);


    private getNotebookPanelCount = () =>
        (this.notebookDigest?.nextWorkEntries.length ?? 0)
        + (this.notebookDigest?.evidenceMissingEntries.length ?? 0)
        + this.getNotebookRecentEntries().length
        + this.getNotebookSelectedRecordEntries().length
        + (this.canRunNotebookDailyLogAction() ? 1 : 0)
        + (this.canRunNotebookRecordMemoAction() ? 1 : 0);


    private getCloseoutPanelCount = () =>
        this.getCloseoutIssues().length + this.closeoutBatchUpdates.length;


    private matchesActiveRecordWorkFilter(documentId: string): boolean {

        if (this.activeRecordWorkFilterId === 'all') return true;

        const document = this.projectDocuments.find(candidate => candidate.resource.id === documentId);
        if (!document || !this.stats) return false;

        return matchesKoreanFieldworkRecordWorkFilter(
            document,
            this.activeRecordWorkFilterId,
            this.projectDocuments,
            this.stats.issueCountByDocumentId
        );
    }


    private getNotebookRecordMemoParentDocument(): Document|undefined {

        const selectedDocument = this.getNotebookSelectedRecordDocument();
        const penMemoCategory = getCategory(NOTEBOOK_RECORD_MEMO_CATEGORY, this.projectConfiguration);
        if (!selectedDocument || !penMemoCategory) return undefined;

        return canCreateKoreanFieldworkChildRecord(
            penMemoCategory,
            selectedDocument,
            this.projectConfiguration
        )
            ? selectedDocument
            : undefined;
    }


    private getNotebookContinuationParentDocument(entry: KoreanFieldworkNotebookEntry): Document|undefined {

        return entry.targetDocument ?? entry.sourceDocument;
    }


    private getNotebookSelectedRecordDocument(): Document|undefined {

        const selectedDocument = this.viewFacade.getSelectedDocument?.();
        if (!selectedDocument?.resource?.category) return undefined;

        const currentDocument = this.projectDocuments.find(document =>
            document.resource.id === selectedDocument.resource.id
        ) ?? selectedDocument;

        return NOTEBOOK_RECORD_MEMO_TARGET_CATEGORIES.has(currentDocument.resource.category)
            ? currentDocument
            : undefined;
    }


    private getSelectedRecordWorkbenchDocument(): Document|undefined {

        return this.getNotebookSelectedRecordDocument();
    }


    private getHierarchyScopeDocument(): Document|undefined {

        const selectedDocument = this.getNotebookSelectedRecordDocument();

        return isKoreanFieldworkHierarchyScopeDocument(selectedDocument)
            ? selectedDocument
            : undefined;
    }


    private getDocumentById(documentId: string): Document|undefined {

        return this.projectDocuments.find(document => document.resource.id === documentId);
    }


}


function makeWorkbenchActionsByDocumentId(workbenchItems: KoreanFieldworkWorkbenchItem[],
                                          documentsById: Map<string, Document>,
                                          documents: Document[],
                                          projectConfiguration: ProjectConfiguration)
        : Map<string, KoreanFieldworkRecordActionItem[]> {

    const actionsByDocumentId = new Map<string, KoreanFieldworkRecordActionItem[]>();

    workbenchItems.forEach(item => {
        const document = documentsById.get(item.documentId);
        if (!document) return;

        const actions = makeKoreanFieldworkRecordActions(
            document,
            documents,
            projectConfiguration,
            2
        );
        if (actions.length > 0) actionsByDocumentId.set(item.documentId, actions);
    });

    return actionsByDocumentId;
}


function makeCloseoutBatchUpdates(documents: Document[],
                                  documentsById: Map<string, Document>,
                                  projectConfiguration: ProjectConfiguration)
        : KoreanFieldworkCloseoutBatchUpdate[] {

    const allCloseoutIssues = makeKoreanFieldworkCloseoutSummary(
        documents,
        Number.MAX_SAFE_INTEGER
    ).issues;
    const issueActions = getKoreanFieldworkCloseoutIssueActions(
        allCloseoutIssues,
        documentsById,
        document => getKoreanFieldworkContinuationActions(document, projectConfiguration)
            .map(action => action.categoryName)
    );

    return getKoreanFieldworkCloseoutBatchUpdates(issueActions);
}


function getNotebookDailyLogParentDocumentId(documents: Document[],
                                             projectConfiguration: ProjectConfiguration): string|undefined {

    const dailyLogCategory = getCategory('DailyLog', projectConfiguration);
    if (!dailyLogCategory) return undefined;

    return documents.find(document =>
        document.resource.category === 'Operation'
        && canCreateKoreanFieldworkChildRecord(dailyLogCategory, document, projectConfiguration)
    )?.resource.id;
}


function getCategory(categoryName: string, projectConfiguration: ProjectConfiguration) {

    try {
        return projectConfiguration.getCategory(categoryName);
    } catch (_) {
        return undefined;
    }
}


function normalizeIdentifierInput(value: unknown): string {

    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}
