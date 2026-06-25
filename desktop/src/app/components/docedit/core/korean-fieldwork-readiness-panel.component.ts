import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    Datastore,
    Document,
    Field,
    KoreanFieldworkReadinessIssue,
    KoreanFieldworkReadinessSeverity,
    ProjectConfiguration
} from 'idai-field-core';
import {
    getKoreanFieldworkDefaultFieldValues
} from '../../../util/korean-fieldwork-draft-defaults';
import {
    KoreanFieldworkEvidenceReview,
    makeKoreanFieldworkEvidenceReview
} from '../../../util/korean-fieldwork-evidence-review';
import { DoceditComponent } from '../docedit.component';


const SOIL_PROFILE_PHOTO_CATEGORY = 'SoilProfilePhoto';
const DEPICTS_RELATION = 'depicts';
const LIES_WITHIN_RELATION = 'liesWithin';
const EVIDENCE_CREATION_ACTIONS: EvidenceCreationAction[] = [
    { metricId: 'featureSegments', categoryName: 'FeatureSegment', label: '피트 기록 만들기' },
    { metricId: 'photos', categoryName: 'Photo', label: '사진 기록 만들기' },
    { metricId: 'soilProfilePhotos', categoryName: SOIL_PROFILE_PHOTO_CATEGORY, label: '토층사진 기록 만들기' },
    { metricId: 'drawings', categoryName: 'Drawing', label: '도면 기록 만들기' },
    { metricId: 'finds', categoryName: 'Find', label: '유물 기록 만들기' },
    { metricId: 'samples', categoryName: 'Sample', label: '시료 기록 만들기' }
];

interface EvidenceCreationAction {
    metricId: string;
    categoryName: string;
    label: string;
}

interface SafeResolutionTarget {
    document: Document;
    updates: { [fieldName: string]: unknown };
}


@Component({
    selector: 'korean-fieldwork-readiness-panel',
    templateUrl: './korean-fieldwork-readiness-panel.html',
    standalone: false
})
export class KoreanFieldworkReadinessPanelComponent implements OnChanges {

    @Input() document: Document;
    @Input() fieldDefinitions: Array<Field>;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public issues: KoreanFieldworkReadinessIssue[] = [];
    public evidenceReview: KoreanFieldworkEvidenceReview|undefined;
    public isLoading: boolean = false;

    private refreshId: number = 0;
    private createdDocuments: Document[] = [];
    private projectDocuments: Document[] = [];


    constructor(private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private modalService: NgbModal) {}


    ngOnChanges() {

        this.refreshIssues();
    }


    public async refreshIssues() {

        const currentRefreshId = ++this.refreshId;

        if (!this.document?.resource?.id || !this.hasKoreanFieldworkContext()) {
            this.issues = [];
            this.evidenceReview = undefined;
            return;
        }

        this.isLoading = true;

        try {
            const documents = await this.getProjectDocuments();
            if (currentRefreshId !== this.refreshId) return;

            this.projectDocuments = documents;
            this.evidenceReview = makeKoreanFieldworkEvidenceReview(this.document, documents);
            this.issues = this.evidenceReview.issues
                .sort((issueA, issueB) =>
                    compareIssuesForCurrentDocument(issueA, issueB, this.document.resource.id)
                );
        } finally {
            if (currentRefreshId === this.refreshId) this.isLoading = false;
        }
    }


    public shouldShow = () => this.issues.length > 0 || this.evidenceReview !== undefined;


    public getVisibleIssues = () => this.issues.slice(0, 4);


    public getHiddenIssueCount = () => Math.max(0, this.issues.length - this.getVisibleIssues().length);


    public getEvidenceMetrics(): Array<{ id: string, label: string, count: number }> {

        if (!this.evidenceReview) return [];

        return [
            { id: 'featureSegments', label: '피트', count: this.evidenceReview.featureSegments.length },
            { id: 'layers', label: '토색 메모', count: this.evidenceReview.layers.length },
            { id: 'photos', label: '사진', count: this.evidenceReview.photos.length },
            { id: 'soilProfilePhotos', label: '토층사진', count: this.evidenceReview.soilProfilePhotos.length },
            {
                id: 'soilColorCandidates',
                label: '토색 후보',
                count: this.evidenceReview.soilColorCandidateSummaries.length
            },
            { id: 'drawings', label: '도면', count: this.evidenceReview.drawings.length },
            { id: 'penMemos', label: '야장 메모', count: this.evidenceReview.penMemos.length },
            {
                id: 'penMemoSketches',
                label: '스케치 메모',
                count: this.evidenceReview.penMemoSketchSummaries.length
            },
            {
                id: 'pendingPenMemoTranscriptions',
                label: '전사 대기',
                count: this.evidenceReview.pendingPenMemoTranscriptions.length
            },
            { id: 'finds', label: '유물', count: this.evidenceReview.finds.length },
            { id: 'samples', label: '시료', count: this.evidenceReview.samples.length },
            {
                id: 'reportReviews',
                label: '검토',
                count: this.evidenceReview.reportPreparationReviews.length
                    + this.evidenceReview.reportEditorialCrossChecks.length
            }
        ];
    }


    public getMissingEvidenceLabels = () =>
        this.evidenceReview?.missingEvidenceKinds.map(getMissingEvidenceLabel) ?? [];


    public getPenMemoTranscriptionSummaryLabels = () =>
        this.evidenceReview?.penMemoTranscriptionSummaries.map(summary =>
            `${this.getDocumentLabel(summary.document)} · ${summary.label}`
        ) ?? [];


    public getEvidenceReviewStatusLabel(): string {

        if (!this.evidenceReview) return '';
        if (this.evidenceReview.reportReady) return '마감 가능';
        if (this.evidenceReview.hasOpenIssues) return '보완 필요';

        return '자료 보완';
    }


    public getEvidenceCreationActions(): EvidenceCreationAction[] {

        if (!this.evidenceReview) return [];

        const evidenceCounts = this.getEvidenceMetrics().reduce((result, metric) => {
            result[metric.id] = metric.count;
            return result;
        }, {} as { [metricId: string]: number });

        return EVIDENCE_CREATION_ACTIONS.filter(action =>
            evidenceCounts[action.metricId] === 0
            && this.canCreateLinkedEvidence(action.categoryName)
        );
    }


    public getSafeResolutionIssueCount = () => this.getSafeResolutionIssues().length;


    public hasSafeResolutionIssues = () => this.getSafeResolutionIssueCount() > 0;


    public canResolveIssue = (issue: KoreanFieldworkReadinessIssue): boolean =>
        (
            this.isCurrentDocumentIssue(issue)
            && this.getResolutionUpdates(issue, this.document) !== undefined
        )
            || this.canCreateSoilProfilePhoto(issue);


    public isCurrentDocumentIssue = (issue: KoreanFieldworkReadinessIssue): boolean =>
        issue.documentId === this.document?.resource?.id;


    public canOpenIssueDocument = (issue: KoreanFieldworkReadinessIssue): boolean =>
        !this.isCurrentDocumentIssue(issue) && !!issue.documentId;


    public getResolutionLabel(issue: KoreanFieldworkReadinessIssue): string {

        switch (issue.ruleId) {
            case 'feature-complete-photo':
                return '완료사진 체크';
            case 'finds-recovered-pre-photo':
                return '수습 전 사진 체크';
            case 'field-only-timing':
                return '현장 한정 기록 표시';
            case 'soil-profile-photo-count':
                return '토층사진 기록 만들기';
            default:
                return '반영';
        }
    }


    public async resolveIssue(issue: KoreanFieldworkReadinessIssue) {

        const updates = this.getResolutionUpdates(issue, this.document);
        if (updates) {
            if (issue.documentId !== this.document?.resource?.id) return;

            Object.entries(updates).forEach(([fieldName, value]) => {
                this.document.resource[fieldName] = mergeValue(this.document.resource[fieldName], value);
            });

            this.onChanged.emit();
            await this.refreshIssues();
            return;
        }

        if (this.canCreateSoilProfilePhoto(issue)) {
            const createdDocument = await this.datastore.create(this.createSoilProfilePhotoDraft());
            this.createdDocuments.push(createdDocument);

            this.onChanged.emit();
            await this.refreshIssues();
        }
    }


    public async resolveSafeProjectIssues() {

        const targets = this.getSafeResolutionTargets();
        if (targets.length === 0) return;

        let currentDocumentChanged = false;
        const documentsToPersist: Document[] = [];

        targets.forEach(target => {
            const updatedDocument = target.document.resource.id === this.document.resource.id
                ? this.document
                : Document.clone(target.document);

            Object.entries(target.updates).forEach(([fieldName, value]) => {
                updatedDocument.resource[fieldName] = mergeValue(updatedDocument.resource[fieldName], value);
            });

            if (updatedDocument.resource.id === this.document.resource.id) {
                currentDocumentChanged = true;
            } else {
                documentsToPersist.push(updatedDocument);
            }
        });

        if (documentsToPersist.length > 0) {
            const updatedDocuments = await this.datastore.bulkUpdate(documentsToPersist);
            this.mergeRecentlyChangedDocuments(updatedDocuments);
        }

        if (currentDocumentChanged || documentsToPersist.length > 0) {
            this.onChanged.emit();
            await this.refreshIssues();
        }
    }


    public async createEvidenceRecord(action: EvidenceCreationAction) {

        if (!this.canCreateLinkedEvidence(action.categoryName)) return;

        const createdDocument = await this.datastore.create(
            this.createLinkedEvidenceDraft(action.categoryName)
        );
        this.createdDocuments.push(createdDocument);

        this.onChanged.emit();
        await this.refreshIssues();
    }


    public async openIssueDocument(issue: KoreanFieldworkReadinessIssue) {

        if (!this.canOpenIssueDocument(issue)) return;

        const issueDocument = await this.datastore.get(issue.documentId);
        const modalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        await modalRef.componentInstance.setDocument(issueDocument);

        try {
            const result = await modalRef.result;
            if (result?.documents) {
                this.mergeRecentlyChangedDocuments(result.documents);
                this.onChanged.emit();
                await this.refreshIssues();
            }
        } catch (_) {
            // The nested edit modal was canceled.
        }
    }


    public getSeverityLabel(severity: KoreanFieldworkReadinessSeverity): string {

        switch (severity) {
            case 'critical':
                return '필수 확인';
            case 'warning':
                return '보완 필요';
            default:
                return '참고';
        }
    }


    public getIssueContextLabel(issue: KoreanFieldworkReadinessIssue): string {

        return this.isCurrentDocumentIssue(issue)
            ? '현재 기록'
            : issue.identifier;
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
            const hasCurrentDocument = documentsWithCreatedDrafts.some(document =>
                document.resource.id === currentDocumentId
            );

            return hasCurrentDocument
                ? documentsWithCreatedDrafts
                : documentsWithCreatedDrafts.concat(this.document);
        } catch (_) {
            return [this.document].concat(this.createdDocuments);
        }
    }


    private hasKoreanFieldworkContext(): boolean {

        return this.fieldDefinitions?.some(field => [
            'featureInvestigationChecklist',
            'fieldRecordQuality',
            'longAxisOrientation',
            'projectInvestigationMode',
            'soilColorAssistStatus',
            'soilProfileColorSwatches'
        ].includes(field.name)) ?? false;
    }


    private getResolutionUpdates(issue: KoreanFieldworkReadinessIssue,
                                 targetDocument: Document): { [fieldName: string]: unknown }|undefined {

        switch (issue.ruleId) {
            case 'feature-complete-photo':
                return {
                    featureInvestigationChecklist: this.mergeChecklistValues(
                        targetDocument,
                        ['completionPhotoTaken']
                    )
                };
            case 'finds-recovered-pre-photo':
                return {
                    featureInvestigationChecklist: this.mergeChecklistValues(
                        targetDocument,
                        ['preRecoveryFindPhotoTaken']
                    )
                };
            case 'field-only-timing':
                return {
                    recordCreationTiming: 'fieldOnlyObservation'
                };
            default:
                return undefined;
        }
    }


    private getSafeResolutionTargets(): SafeResolutionTarget[] {

        const targetsByDocumentId = new Map<string, SafeResolutionTarget>();

        this.getSafeResolutionIssues().forEach(({ document, updates }) => {
            const existingTarget = targetsByDocumentId.get(document.resource.id);
            targetsByDocumentId.set(document.resource.id, existingTarget
                ? {
                    document,
                    updates: this.mergeResolutionUpdates(existingTarget.updates, updates)
                }
                : { document, updates }
            );
        });

        return Array.from(targetsByDocumentId.values());
    }


    private getSafeResolutionIssues(): SafeResolutionTarget[] {

        return this.issues
            .map(issue => {
                const document = this.getIssueDocument(issue);
                const updates = document ? this.getResolutionUpdates(issue, document) : undefined;

                return document && updates
                    ? { document, updates }
                    : undefined;
            })
            .filter((target): target is SafeResolutionTarget => target !== undefined);
    }


    private mergeResolutionUpdates(currentUpdates: { [fieldName: string]: unknown },
                                   nextUpdates: { [fieldName: string]: unknown })
            : { [fieldName: string]: unknown } {

        return Object.entries(nextUpdates).reduce((result, [fieldName, value]) => ({
            ...result,
            [fieldName]: mergeValue(result[fieldName], value)
        }), { ...currentUpdates });
    }


    private getIssueDocument(issue: KoreanFieldworkReadinessIssue): Document|undefined {

        if (issue.documentId === this.document?.resource?.id) return this.document;

        return this.projectDocuments.find(document => document.resource.id === issue.documentId)
            ?? this.createdDocuments.find(document => document.resource.id === issue.documentId);
    }


    private canCreateSoilProfilePhoto(issue: KoreanFieldworkReadinessIssue): boolean {

        return issue.ruleId === 'soil-profile-photo-count'
            && issue.documentId === this.document?.resource?.id
            && !!this.document?.resource?.id
            && !!this.projectConfiguration.getCategory(SOIL_PROFILE_PHOTO_CATEGORY)
            && this.projectConfiguration.isAllowedRelationDomainCategory(
                SOIL_PROFILE_PHOTO_CATEGORY,
                this.document.resource.category,
                DEPICTS_RELATION
            );
    }


    private canCreateLinkedEvidence(categoryName: string): boolean {

        return !!this.document?.resource?.id
            && !!this.projectConfiguration.getCategory(categoryName)
            && this.getLinkedEvidenceRelations(categoryName) !== undefined;
    }


    private createLinkedEvidenceDraft(categoryName: string): Document {

        const category = this.projectConfiguration.getCategory(categoryName);

        return {
            resource: {
                identifier: `${toKebabCase(categoryName)}-${Date.now()}`,
                category: categoryName,
                relations: this.getLinkedEvidenceRelations(categoryName),
                ...getKoreanFieldworkDefaultFieldValues(category)
            }
        } as any;
    }


    private getLinkedEvidenceRelations(categoryName: string): { [relationName: string]: string[] }|undefined {

        const documentId = this.document?.resource?.id;
        const parentCategoryName = this.document?.resource?.category;
        if (!documentId || !parentCategoryName) return undefined;

        if (this.projectConfiguration.isAllowedRelationDomainCategory(
                categoryName,
                parentCategoryName,
                DEPICTS_RELATION
        )) {
            return { [DEPICTS_RELATION]: [documentId] };
        }

        if (this.projectConfiguration.isAllowedRelationDomainCategory(
                categoryName,
                parentCategoryName,
                LIES_WITHIN_RELATION
        )) {
            return { [LIES_WITHIN_RELATION]: [documentId] };
        }

        return undefined;
    }


    private createSoilProfilePhotoDraft(): Document {

        const category = this.projectConfiguration.getCategory(SOIL_PROFILE_PHOTO_CATEGORY);

        return {
            resource: {
                identifier: `soil-profile-photo-${Date.now()}`,
                category: SOIL_PROFILE_PHOTO_CATEGORY,
                relations: {
                    [DEPICTS_RELATION]: [this.document.resource.id]
                },
                ...getKoreanFieldworkDefaultFieldValues(category)
            }
        } as any;
    }


    private mergeChecklistValues(targetDocument: Document, checklistValues: string[]): string[] {

        const existingValue = targetDocument?.resource?.featureInvestigationChecklist;
        const mergedValues = Array.isArray(existingValue)
            ? existingValue.filter((value): value is string => typeof value === 'string')
            : [];

        checklistValues.forEach(value => {
            if (!mergedValues.includes(value)) mergedValues.push(value);
        });

        return mergedValues;
    }


    private mergeRecentlyChangedDocuments(documents: Document[]) {

        documents.forEach(document => {
            this.createdDocuments = this.createdDocuments.some(createdDocument =>
                createdDocument.resource.id === document.resource.id
            )
                ? this.createdDocuments.map(createdDocument =>
                    createdDocument.resource.id === document.resource.id ? document : createdDocument
                )
                : this.createdDocuments.concat(document);
        });
    }


    private getDocumentLabel(document: Document): string {

        return document.resource.identifier || document.resource.id;
    }
}


function compareIssues(issueA: KoreanFieldworkReadinessIssue, issueB: KoreanFieldworkReadinessIssue): number {

    const severityDiff = getSeverityOrder(issueA.severity) - getSeverityOrder(issueB.severity);

    return severityDiff
        || issueA.identifier.localeCompare(issueB.identifier)
        || issueA.ruleId.localeCompare(issueB.ruleId);
}


function compareIssuesForCurrentDocument(issueA: KoreanFieldworkReadinessIssue,
                                         issueB: KoreanFieldworkReadinessIssue,
                                         currentDocumentId: string): number {

    const currentDocumentDiff = Number(issueB.documentId === currentDocumentId)
        - Number(issueA.documentId === currentDocumentId);

    return currentDocumentDiff || compareIssues(issueA, issueB);
}


function getSeverityOrder(severity: KoreanFieldworkReadinessSeverity): number {

    switch (severity) {
        case 'critical':
            return 0;
        case 'warning':
            return 1;
        default:
            return 2;
    }
}


function mergeValue(currentValue: unknown, nextValue: unknown): unknown {

    if (Array.isArray(currentValue) && Array.isArray(nextValue)) {
        return currentValue.concat(nextValue)
            .filter((value, index, values) => values.indexOf(value) === index);
    }

    return nextValue;
}


function getMissingEvidenceLabel(kind: string): string {

    switch (kind) {
        case 'photo':
            return '사진';
        case 'drawing':
            return '도면';
        case 'reportReview':
            return '검토 기록';
        case 'penMemoTranscription':
            return '야장 전사';
        default:
            return kind;
    }
}


function toKebabCase(value: string): string {

    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}
