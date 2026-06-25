import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    buildEvidenceBundle,
    Condition,
    Datastore,
    Document,
    EvidenceBundle,
    Field,
    Labels,
    ProjectConfiguration
} from 'idai-field-core';
import { Routing } from '../../../services/routing';
import {
    createKoreanFieldworkDraftResource,
    getKoreanFieldworkContinuationActions,
    KoreanFieldworkContinuationAction
} from '../../../util/korean-fieldwork-document-drafts';
import {
    getKoreanFieldworkActiveFeatureGuidancePreset,
    getKoreanFieldworkFeatureGuidanceChecklistFields,
    getKoreanFieldworkFeatureGuidanceSelectedAttributeLabels,
    KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS,
    KoreanFieldworkFeatureGuidancePreset
} from '../../../util/korean-fieldwork-feature-guidance';
import {
    canReviseKoreanFieldworkIdentifier,
    getKoreanFieldworkFieldIdentifier,
    getKoreanFieldworkIdentifierRevisionHistory,
    getKoreanFieldworkIdentifierRevisionUpdates,
    getKoreanFieldworkReportIdentifier
} from '../../../util/korean-fieldwork-identifier-revision';
import {
    getKoreanFieldworkNotebookEntriesForDocument,
    KoreanFieldworkNotebookEntry
} from '../../../util/korean-fieldwork-notebook-digest';
import {
    getPenMemoSketchSummaries,
    getPenMemoSketchPreview,
    KoreanFieldworkPenMemoSketchPreview,
    getPenMemoSketchSummaryLabel,
    getPenMemoTranscriptionSummaryLabel,
    getSoilColorCandidateSummaries
} from '../../../util/korean-fieldwork-evidence-review';
import {
    KoreanFieldworkRecordActionItem,
    makeKoreanFieldworkRecordActions
} from '../../../util/korean-fieldwork-record-actions';
import { getKoreanFieldworkEvidenceChips } from '../../../util/korean-fieldwork-record-evidence';
import { DoceditComponent } from '../docedit.component';


interface ContextChip {
    label: string;
    tone: 'neutral'|'info'|'success'|'warning'|'danger';
}

interface ContextMetric {
    id: string;
    label: string;
    count: number;
}

interface EvidenceMetric extends ContextMetric {
    canCreate: boolean;
}

interface EvidenceInsight {
    detail: string;
    id: string;
    label: string;
    sketchPreview?: KoreanFieldworkPenMemoSketchPreview;
    tone: 'info'|'warning';
}

const KOREAN_FIELDWORK_CONTEXT_FIELDS = [
    'featureInvestigationChecklist',
    'featureRecordingStatus',
    'fieldRecordQuality',
    'longAxisOrientation',
    'projectInvestigationMode',
    'recordCreationTiming',
    'soilColorAssistStatus',
    'verificationState'
];

const KOREAN_FIELDWORK_CONTEXT_CATEGORIES = new Set<string>([
    'Operation',
    'Trench',
    'FeatureGroup',
    'Feature',
    'FeatureSegment',
    'Layer',
    'Survey',
    'SurveyBoundary',
    'Find',
    'FindCollection',
    'Sample',
    'Photo',
    'SoilProfilePhoto',
    'Drawing',
    'PenMemo',
    'DailyLog',
    'FieldRecordQualityReview'
]);

const DIRECT_PARENT_RELATIONS = [
    'liesWithin',
    'isRecordedInFeature',
    'depicts',
    'isDepictedIn',
    'isMapLayerOf',
    'isRecordedIn'
];

const CHILD_RELATIONS = ['liesWithin', 'isRecordedIn', 'isRecordedInFeature'];
const LINKED_EVIDENCE_RELATIONS = ['depicts', 'isDepictedIn', 'isMapLayerOf', 'isSubjectOf', 'isResultOf'];
const NOTEBOOK_APPEND_TARGET_FIELDS = ['description', 'featureChecklistNote', 'interpretation', 'shortDescription'];
const FEATURE_CATEGORY_NAME = 'Feature';

const FEATURE_RECORDING_STATUS_LABELS: Readonly<Record<string, ContextChip>> = {
    candidate: { label: '조사 전', tone: 'warning' },
    investigating: { label: '조사 중', tone: 'info' },
    confirmed: { label: '완료', tone: 'success' }
};

const RECORD_CREATION_TIMING_LABELS: Readonly<Record<string, ContextChip>> = {
    duringFieldwork: { label: '추가 기록', tone: 'info' },
    sameDayFieldRecord: { label: '당일 기록', tone: 'success' },
    fieldOnlyObservation: { label: '현장 한정', tone: 'warning' },
    handoverStage: { label: '인계 단계', tone: 'info' },
    reportStageGenerated: { label: '보고 단계', tone: 'neutral' },
    postExcavationDerived: { label: '정리 파생', tone: 'neutral' }
};

const VERIFICATION_STATE_LABELS: Readonly<Record<string, ContextChip>> = {
    observedInField: { label: '현장 확인', tone: 'success' },
    candidate: { label: '확인 후보', tone: 'warning' },
    inferred: { label: '추정', tone: 'info' },
    conflictingEvidence: { label: '근거 충돌', tone: 'danger' },
    notObserved: { label: '미확인', tone: 'neutral' },
    needsRecheck: { label: '재검토', tone: 'warning' },
    pendingDecision: { label: '추가 확인', tone: 'warning' }
};

const GEOMETRY_EDIT_STATUS_LABELS: Readonly<Record<string, ContextChip>> = {
    roughSketch: { label: '약도', tone: 'warning' },
    needsAerialAlignment: { label: '항공 보정', tone: 'warning' },
    alignedToAerialMap: { label: '항공 보정됨', tone: 'success' },
    measured: { label: '실측', tone: 'success' }
};


@Component({
    selector: 'korean-fieldwork-record-context-panel',
    templateUrl: './korean-fieldwork-record-context-panel.html',
    standalone: false
})
export class KoreanFieldworkRecordContextPanelComponent implements OnChanges {

    @Input() document: Document;
    @Input() fieldDefinitions: Field[];

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public parentPathLabel: string|undefined;
    public metrics: ContextMetric[] = [];
    public evidenceMetrics: EvidenceMetric[] = [];
    public evidenceInsights: EvidenceInsight[] = [];
    public notebookEntries: KoreanFieldworkNotebookEntry[] = [];
    public continuationActions: KoreanFieldworkContinuationAction[] = [];
    public recordActions: KoreanFieldworkRecordActionItem[] = [];
    public identifierRevisionNextValue: string = '';
    public identifierRevisionReason: string = '';

    private createdDocuments: Document[] = [];
    private identifierRevisionDraftKey: string|undefined;


    constructor(private datastore: Datastore,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private routing: Routing,
                private modalService: NgbModal) {}


    async ngOnChanges() {

        this.initializeIdentifierRevisionDraft();
        await this.refreshContext();
    }


    public shouldShow = () => this.hasKoreanFieldworkContext();


    public getCategoryLabel(): string {

        const category = this.projectConfiguration.getCategory(this.document?.resource?.category);

        return category
            ? this.labels.get(category)
            : this.document?.resource?.category ?? '';
    }


    public getCurrentIdentifier(): string {

        return this.document?.resource?.identifier || this.document?.resource?.id || '';
    }


    public getStatusChips(): ContextChip[] {

        const resource = this.document?.resource as any;
        if (!resource) return [];

        const chips: ContextChip[] = [];
        const orientationChip = this.getLongAxisOrientationChip(resource);

        if (orientationChip) chips.push(orientationChip);
        this.pushMappedChip(chips, resource.featureRecordingStatus, FEATURE_RECORDING_STATUS_LABELS);
        this.pushFeatureAttributeChip(chips);
        this.pushMappedChip(chips, resource.verificationState, VERIFICATION_STATE_LABELS);
        this.pushMappedChip(chips, resource.recordCreationTiming, RECORD_CREATION_TIMING_LABELS);
        this.pushMappedChip(chips, resource.featureGeometryEditStatus, GEOMETRY_EDIT_STATUS_LABELS);

        if (Array.isArray(resource.fieldRecordQuality)) {
            chips.push(resource.fieldRecordQuality.length > 0
                ? { label: `기록 구분 ${resource.fieldRecordQuality.length}`, tone: 'success' }
                : { label: '기록 보완', tone: 'warning' });
        }

        return this.dedupeChips(chips).slice(0, 5);
    }


    public hasNotebookEntries = () => this.notebookEntries.length > 0;


    public getNotebookEntries = () => this.notebookEntries;


    public hasContinuationActions = () => this.continuationActions.length > 0;


    public getContinuationActions = () => this.continuationActions;


    public hasRecordActions = () => this.recordActions.length > 0;


    public hasRecordActionEmptyState = () =>
        this.hasKoreanFieldworkContext() && !this.hasRecordActions();


    public getRecordActions = () => this.recordActions;


    public hasEvidenceMetrics = () => this.evidenceMetrics.length > 0;


    public getEvidenceMetrics = () => this.evidenceMetrics;


    public hasEvidenceInsights = () => this.evidenceInsights.length > 0;


    public getEvidenceInsights = () => this.evidenceInsights;


    public getContinuationActionLabel(action: KoreanFieldworkContinuationAction): string {

        const category = this.projectConfiguration.getCategory(action.categoryName);

        return category ? this.labels.get(category) : action.categoryName;
    }


    public getContinuationActionDetail(action: KoreanFieldworkContinuationAction): string {

        switch (action.relationName) {
            case 'liesWithin':
                return '포함 위치: 현재 기록';
            case 'depicts':
                return '사진·도면·메모 같은 근거로 연결';
            case 'isRecordedIn':
                return '현재 조사 구역에 붙이기';
            case 'isMapLayerOf':
                return '지도 레이어로 연결';
            default:
                return '현재 기록에 연결';
        }
    }


    public isFeatureContinuationAction = (action: KoreanFieldworkContinuationAction): boolean =>
        action.categoryName === FEATURE_CATEGORY_NAME;


    public getFeatureContinuationPresets = (): readonly KoreanFieldworkFeatureGuidancePreset[] =>
        KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS;


    public getFeatureContinuationPresetLabel(preset: KoreanFieldworkFeatureGuidancePreset): string {

        return preset.featureType === 'unknown'
            ? '유구로 만들기'
            : preset.label;
    }


    public getFeatureContinuationDetail(action: KoreanFieldworkContinuationAction): string {

        return `${this.getContinuationActionDetail(action)} · 성격을 고른 뒤 시작`;
    }


    public canShowIdentifierRevision = (): boolean =>
        canReviseKoreanFieldworkIdentifier(this.document)
        && [
            'fieldIdentifier',
            'reportIdentifier',
            'identifierRevisionHistory',
            'identifierRevisionNote'
        ].every(fieldName => !!this.getField(fieldName));


    public getIdentifierRevisionFieldIdentifier(): string {

        return this.document ? getKoreanFieldworkFieldIdentifier(this.document) : '';
    }


    public getIdentifierRevisionHistoryCount(): number {

        return this.document
            ? getKoreanFieldworkIdentifierRevisionHistory(this.document).length
            : 0;
    }


    public setIdentifierRevisionNextValue(value: string) {

        this.identifierRevisionNextValue = value;
    }


    public setIdentifierRevisionReason(value: string) {

        this.identifierRevisionReason = value;
    }


    public canApplyIdentifierRevision(): boolean {

        const nextIdentifier = this.normalizeIdentifierInput(this.identifierRevisionNextValue);
        const currentIdentifier = this.normalizeIdentifierInput(this.document?.resource?.identifier);

        return this.canShowIdentifierRevision()
            && nextIdentifier.length > 0
            && nextIdentifier !== currentIdentifier;
    }


    public applyIdentifierRevision() {

        if (!this.document?.resource || !this.canApplyIdentifierRevision()) return;

        const updates = getKoreanFieldworkIdentifierRevisionUpdates(this.document, {
            nextIdentifier: this.identifierRevisionNextValue,
            reason: this.identifierRevisionReason
        });
        if (Object.keys(updates).length === 0) return;

        Object.entries(updates).forEach(([fieldName, value]) => {
            this.document.resource[fieldName] = value;
        });
        this.initializeIdentifierRevisionDraft(true);
        this.onChanged.emit();
    }


    public getNotebookEntryDetail(entry: KoreanFieldworkNotebookEntry): string {

        return entry.nextWork || entry.detail || '야장 내용을 확인하세요.';
    }


    public getNotebookEntryTone(entry: KoreanFieldworkNotebookEntry): 'warning'|'info'|'neutral' {

        if (entry.needsEvidenceNumbers) return 'warning';
        return entry.nextWork ? 'info' : 'neutral';
    }


    public getNotebookEntryActionLabel(entry: KoreanFieldworkNotebookEntry): string {

        return `${entry.sourceLabel} 열기`;
    }


    public canApplyNotebookEntry = (entry: KoreanFieldworkNotebookEntry) =>
        !!this.getNotebookAppendTargetField(entry);


    public getNotebookEntryApplyTargetLabel(entry: KoreanFieldworkNotebookEntry): string {

        const fieldName = this.getNotebookAppendTargetField(entry);
        if (!fieldName) return '기록';

        const field = this.getField(fieldName);
        return field ? this.labels.get(field) : fieldName;
    }


    public async openNotebookEntry(entry: KoreanFieldworkNotebookEntry) {

        await this.routing.jumpToResource(entry.sourceDocument);
    }


    public applyNotebookEntry(entry: KoreanFieldworkNotebookEntry) {

        if (!this.document?.resource) return;

        const targetField = this.getNotebookAppendTargetField(entry);
        if (!targetField) return;

        const currentValue = this.getStringResourceFieldValue(targetField);
        const nextValue = this.appendNotebookText(currentValue, this.getNotebookAppendText(entry));
        if (currentValue === nextValue) return;

        this.document.resource[targetField] = nextValue;
        this.onChanged.emit();
    }


    public async createContinuationRecord(action: KoreanFieldworkContinuationAction) {

        await this.createContinuationDraft(action.categoryName);
    }


    public async createFeatureContinuationRecord(
            action: KoreanFieldworkContinuationAction,
            preset: KoreanFieldworkFeatureGuidancePreset) {

        await this.createContinuationDraft(action.categoryName, preset.featureType);
    }


    public async runRecordAction(action: KoreanFieldworkRecordActionItem) {

        if (action.type === 'openDocument' && action.documentId) {
            await this.routing.jumpToResource(await this.datastore.get(action.documentId));
            return;
        }

        if (action.type === 'createDocument' && action.categoryName) {
            await this.createContinuationDraft(action.categoryName);
        }
    }


    private async createContinuationDraft(categoryName: string, featureType?: string) {

        if (!this.document?.resource?.id) return;

        const draftDocument = {
            resource: createKoreanFieldworkDraftResource(
                this.document,
                categoryName,
                this.projectConfiguration,
                { featureType }
            )
        } as any;
        const modalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        await modalRef.componentInstance.setDocument(draftDocument);

        try {
            const result = await modalRef.result;
            if (result?.documents) {
                this.mergeRecentlyChangedDocuments(result.documents);
                this.onChanged.emit();
                await this.refreshContext();
            }
        } catch (_) {
            // The continuation draft modal was canceled.
        }
    }


    private async refreshContext() {

        if (!this.document?.resource?.id || !this.hasKoreanFieldworkContext()) {
            this.parentPathLabel = undefined;
            this.metrics = [];
            this.evidenceMetrics = [];
            this.evidenceInsights = [];
            this.notebookEntries = [];
            this.continuationActions = [];
            this.recordActions = [];
            return;
        }

        const documents = await this.getProjectDocuments();
        const documentsById = new Map(documents.map(document => [document.resource.id, document]));

        this.parentPathLabel = this.formatParentPath(documentsById);
        this.metrics = [
            {
                id: 'children',
                label: '이어진 기록',
                count: this.countDocumentsTargetingCurrent(documents, CHILD_RELATIONS)
            },
            {
                id: 'linkedEvidence',
                label: '연결',
                count: this.countDocumentsTargetingCurrent(documents, LINKED_EVIDENCE_RELATIONS)
            }
        ];
        this.notebookEntries = getKoreanFieldworkNotebookEntriesForDocument(this.document, documents);
        this.continuationActions = getKoreanFieldworkContinuationActions(
            this.document,
            this.projectConfiguration
        );
        const evidenceBundle = buildEvidenceBundle(this.document, documents);
        this.evidenceMetrics = this.makeEvidenceMetrics(evidenceBundle, documents);
        this.evidenceInsights = this.makeEvidenceInsights(evidenceBundle);
        this.recordActions = makeKoreanFieldworkRecordActions(
            this.document,
            documents,
            this.projectConfiguration,
            4
        );
    }


    private async getProjectDocuments(): Promise<Document[]> {

        try {
            const result = await this.datastore.find({});
            const documents = result.documents ?? [];
            const currentDocumentId = this.document.resource.id;
            const documentsWithCurrentState = documents.map(document =>
                document.resource.id === currentDocumentId ? this.document : document
            );
            const documentsWithCreatedDrafts = this.createdDocuments.reduce((result, createdDocument) =>
                result.some(document => document.resource.id === createdDocument.resource.id)
                    ? result.map(document =>
                        document.resource.id === createdDocument.resource.id ? createdDocument : document
                    )
                    : result.concat(createdDocument),
            documentsWithCurrentState);

            return documentsWithCreatedDrafts.some(document => document.resource.id === currentDocumentId)
                ? documentsWithCreatedDrafts
                : documentsWithCreatedDrafts.concat(this.document);
        } catch (_) {
            return [this.document].concat(this.createdDocuments);
        }
    }


    private formatParentPath(documentsById: Map<string, Document>): string|undefined {

        const path: Document[] = [];
        const visitedIds = new Set<string>([this.document.resource.id]);
        let currentDocument = this.document;

        for (let depth = 0; depth < 8; depth++) {
            const parent = this.getPrimaryParent(currentDocument, documentsById);
            if (!parent || visitedIds.has(parent.resource.id)) break;

            path.unshift(parent);
            visitedIds.add(parent.resource.id);
            currentDocument = parent;
        }

        return path.length > 0
            ? path.map(document => document.resource.identifier || document.resource.id).join(' > ')
            : undefined;
    }


    private getPrimaryParent(document: Document, documentsById: Map<string, Document>): Document|undefined {

        const relations = document.resource.relations ?? {};

        for (const relationName of DIRECT_PARENT_RELATIONS) {
            const parent = this.getFirstExistingDocument(relations[relationName], documentsById, document.resource.id);
            if (parent) return parent;
        }

        return undefined;
    }


    private getFirstExistingDocument(relationTargets: unknown,
                                     documentsById: Map<string, Document>,
                                     currentDocumentId: string): Document|undefined {

        if (!Array.isArray(relationTargets)) return undefined;

        const parentId = relationTargets.find(targetId =>
            typeof targetId === 'string'
            && targetId !== currentDocumentId
            && documentsById.has(targetId)
        );

        return parentId ? documentsById.get(parentId) : undefined;
    }


    private countDocumentsTargetingCurrent(documents: Document[], relationNames: string[]): number {

        const currentDocumentId = this.document.resource.id;

        return documents.filter(candidate =>
            candidate.resource.id !== currentDocumentId
            && relationNames.some(relationName => {
                const targets = candidate.resource.relations?.[relationName];
                return Array.isArray(targets) && targets.includes(currentDocumentId);
            })
        ).length;
    }


    private makeEvidenceMetrics(bundle: EvidenceBundle,
                                documents: Document[]): EvidenceMetric[] {

        const evidenceMetrics = getKoreanFieldworkEvidenceChips(this.document, documents)
            .flatMap(chip => {
                const canCreate = this.canCreateEvidenceCategory(chip.createCategoryName);
                if (chip.count === 0 && !canCreate) return [];

                return [{
                    id: chip.id,
                    label: chip.label,
                    count: chip.count,
                    canCreate
                }];
            });
        const penMemoSketchCount = getPenMemoSketchSummaries(bundle.penMemos).length;
        const penMemoMetrics: EvidenceMetric[] = [
            {
                id: 'penMemos',
                label: '야장 메모',
                count: bundle.penMemos.length,
                canCreate: false
            },
            {
                id: 'penMemoSketches',
                label: '스케치 메모',
                count: penMemoSketchCount,
                canCreate: false
            }
        ].filter(metric => metric.count > 0);

        return evidenceMetrics.concat(penMemoMetrics);
    }


    private makeEvidenceInsights(bundle: EvidenceBundle): EvidenceInsight[] {

        const soilColorInsights = getSoilColorCandidateSummaries(bundle.soilProfilePhotos)
            .map(summary => ({
                detail: `${this.getDocumentLabel(summary.document)} · ${summary.label}`,
                id: `soilColor:${summary.document.resource.id}`,
                label: '토색 후보',
                tone: summary.document.resource.soilColorAssistStatus === 'lowConfidence'
                    ? 'warning' as const
                    : 'info' as const
            }));
        const penMemoSketchInsights = getPenMemoSketchSummaries(bundle.penMemos)
            .map(summary => ({
                detail: summary.pendingTranscription
                    ? `${this.getDocumentLabel(summary.document)} · ${getPenMemoTranscriptionSummaryLabel(summary.document)}`
                    : `${this.getDocumentLabel(summary.document)} · ${getPenMemoSketchSummaryLabel(summary.document.resource.penMemoStrokes)}`,
                id: `penMemoSketch:${summary.document.resource.id}`,
                label: summary.pendingTranscription ? '태블릿 야장 전사' : '야장 스케치',
                sketchPreview: getPenMemoSketchPreview(summary.document.resource.penMemoStrokes),
                tone: summary.pendingTranscription ? 'warning' as const : 'info' as const
            }));

        return [...soilColorInsights, ...penMemoSketchInsights]
            .filter(insight => insight.detail.trim().length > 0)
            .slice(0, 4);
    }


    private getDocumentLabel(document: Document): string {

        return document.resource.identifier || document.resource.id;
    }


    private canCreateEvidenceCategory(categoryName: string|undefined): boolean {

        return !!categoryName
            && this.continuationActions.some(action => action.categoryName === categoryName);
    }


    private hasKoreanFieldworkContext(): boolean {

        return KOREAN_FIELDWORK_CONTEXT_CATEGORIES.has(this.document?.resource?.category)
            && (
                this.fieldDefinitions?.some(field => KOREAN_FIELDWORK_CONTEXT_FIELDS.includes(field.name))
                ?? false
            );
    }


    private getNotebookAppendTargetField(_: KoreanFieldworkNotebookEntry): string|undefined {

        return NOTEBOOK_APPEND_TARGET_FIELDS.find(fieldName => this.isEditableTextField(fieldName));
    }


    private isEditableTextField(fieldName: string): boolean {

        const field = this.getField(fieldName);

        return !!field
            && field.editable === true
            && ['input', 'textarea', 'text'].includes(field.inputType)
            && Condition.isFulfilled(field.condition, this.document.resource, this.fieldDefinitions, 'field');
    }


    private getNotebookAppendText(entry: KoreanFieldworkNotebookEntry): string {

        const lines = [
            `[${entry.sourceLabel} ${entry.dateLabel}]`,
            this.getNotebookAppendLine('관찰', entry.input.observation || entry.detail),
            this.getNotebookAppendLine('해석', entry.input.interpretation),
            this.getNotebookAppendLine('다음 작업', entry.nextWork),
            this.getNotebookAppendLine(
                '사진·도면·스케치·유물·시료 번호',
                entry.evidenceNumbers || (entry.needsEvidenceNumbers ? '번호 확인 필요' : '')
            )
        ].filter((line): line is string => !!line && line.length > 0);

        return lines.join('\n');
    }


    private getNotebookAppendLine(label: string, value: string|undefined): string|undefined {

        const text = typeof value === 'string' ? value.trim() : '';
        return text ? `${label}: ${text}` : undefined;
    }


    private appendNotebookText(currentValue: string, notebookText: string): string {

        const trimmedCurrentValue = currentValue.trimEnd();

        if (trimmedCurrentValue.includes(notebookText)) return trimmedCurrentValue;
        if (!trimmedCurrentValue) return notebookText;

        return `${trimmedCurrentValue}\n${notebookText}`;
    }


    private mergeRecentlyChangedDocuments(documents: Document[]) {

        documents.forEach(document => {
            const existingIndex = this.createdDocuments.findIndex(createdDocument =>
                createdDocument.resource.id === document.resource.id
            );
            if (existingIndex >= 0) {
                this.createdDocuments[existingIndex] = document;
            } else {
                this.createdDocuments.push(document);
            }
        });
    }


    private getStringResourceFieldValue(fieldName: string): string {

        const value = this.document?.resource?.[fieldName];

        return typeof value === 'string' ? value : '';
    }


    private initializeIdentifierRevisionDraft(force: boolean = false) {

        if (!this.document?.resource) return;

        const draftKey = [
            this.document.resource.id,
            this.document.resource.identifier,
            (this.document.resource as any).reportIdentifier
        ].join(':');
        if (!force && draftKey === this.identifierRevisionDraftKey) return;

        this.identifierRevisionDraftKey = draftKey;
        this.identifierRevisionNextValue = getKoreanFieldworkReportIdentifier(this.document);
        this.identifierRevisionReason = '';
    }


    private normalizeIdentifierInput(value: unknown): string {

        return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    }


    private getField(fieldName: string): Field|undefined {

        return this.fieldDefinitions?.find(field => field.name === fieldName);
    }


    private getLongAxisOrientationChip(resource: any): ContextChip|undefined {

        const value = typeof resource.longAxisOrientation === 'string'
            ? resource.longAxisOrientation.trim().replace(/\s+/g, ' ')
            : '';
        if (!value) return undefined;

        const referenceValue = typeof resource.orientationReference === 'string'
            ? resource.orientationReference.trim()
            : '';

        return {
            label: referenceValue ? `장축 ${value} · ${referenceValue}` : `장축 ${value}`,
            tone: 'info'
        };
    }


    private pushMappedChip(chips: ContextChip[],
                           value: unknown,
                           labels: Readonly<Record<string, ContextChip>>) {

        if (typeof value !== 'string') return;
        const chip = labels[value];
        if (chip) chips.push(chip);
    }


    private pushFeatureAttributeChip(chips: ContextChip[]) {

        const preset = getKoreanFieldworkActiveFeatureGuidancePreset(this.document);
        const checklists = getKoreanFieldworkFeatureGuidanceChecklistFields(
            preset,
            this.document,
            this.fieldDefinitions
        );
        if (!preset || checklists.length === 0) return;

        const selectedLabels = getKoreanFieldworkFeatureGuidanceSelectedAttributeLabels(
            this.document,
            checklists
        );

        chips.push(selectedLabels.length > 0
            ? { label: `${preset.label} 핵심 ${this.formatFeatureAttributeLabels(selectedLabels)}`, tone: 'success' }
            : { label: `${preset.label} 핵심 속성 미기록`, tone: 'warning' });
    }


    private formatFeatureAttributeLabels(labels: string[]): string {

        const visibleLabels = labels.slice(0, 3).join('·');
        const hiddenCount = labels.length - 3;

        return hiddenCount > 0 ? `${visibleLabels} 외 ${hiddenCount}` : visibleLabels;
    }


    private dedupeChips(chips: ContextChip[]): ContextChip[] {

        const labels = new Set<string>();

        return chips.filter(chip => {
            if (labels.has(chip.label)) return false;
            labels.add(chip.label);
            return true;
        });
    }
}
