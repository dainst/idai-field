import {
    Document,
    getKoreanFieldworkTodaySummary,
    KoreanFieldworkReadinessIssue
} from 'idai-field-core';
import { getPenMemoSketchSummaryLabel } from './korean-fieldwork-evidence-review';
import { getMunsellCandidateSummaryLabel } from './korean-fieldwork-soil-color-candidates';


export type KoreanFieldworkWorkbenchTone = 'danger'|'warning'|'info'|'success'|'neutral';

export interface KoreanFieldworkWorkbenchItem {
    id: string;
    documentId: string;
    identifier: string;
    category: string;
    categoryLabel: string;
    parentPath?: string;
    reasons: string[];
    issueCount: number;
    tone: KoreanFieldworkWorkbenchTone;
    actionLabel: string;
}

const WORKBENCH_CATEGORIES = new Set<string>([
    'Operation',
    'Trench',
    'FeatureGroup',
    'Feature',
    'FeatureSegment',
    'Layer',
    'Find',
    'FindCollection',
    'Sample',
    'SoilProfilePhoto',
    'PenMemo',
    'DailyLog',
    'FieldRecordQualityReview'
]);

const QUALITY_TRACKED_CATEGORIES = new Set<string>([
    'Operation',
    'Trench',
    'FeatureGroup',
    'Feature',
    'FeatureSegment',
    'Layer',
    'Find',
    'FindCollection',
    'Sample',
    'DailyLog',
    'FieldRecordQualityReview'
]);

const FEATURE_WORKFLOW_CATEGORIES = new Set<string>(['Feature', 'FeatureSegment']);
const PEN_MEMO_CATEGORY = 'PenMemo';
const SOIL_PROFILE_PHOTO_CATEGORY = 'SoilProfilePhoto';

const FEATURE_CHECKLIST_STEPS = [
    'preInvestigationPhotoTaken',
    'inProgressPhotoTaken',
    'soilProfilePhotoLinked',
    'measuredDrawingCompleted',
    'preRecoveryFindPhotoTaken',
    'findsRecovered',
    'samplesCollected',
    'completionPhotoTaken'
];

const REVIEW_VERIFICATION_STATES = new Set(['conflictingEvidence', 'needsRecheck']);
const PARENT_RELATIONS = ['liesWithin', 'isRecordedInFeature', 'isRecordedIn', 'depicts'];

const CATEGORY_ORDER = [
    'Operation',
    'Trench',
    'FeatureGroup',
    'Feature',
    'FeatureSegment',
    'Layer',
    'Find',
    'FindCollection',
    'Sample',
    'SoilProfilePhoto',
    'PenMemo',
    'DailyLog',
    'FieldRecordQualityReview'
];

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
    DailyLog: '작업일지',
    Feature: '유구',
    FeatureGroup: '관련 유구',
    FeatureSegment: '세부 단위',
    FieldRecordQualityReview: '보완 메모',
    Find: '유물',
    FindCollection: '유물 일괄',
    Layer: '토층',
    Operation: '조사 구역 기록',
    PenMemo: '야장 메모',
    Sample: '시료',
    SoilProfilePhoto: '토층사진',
    Trench: '트렌치'
};


export function makeKoreanFieldworkWorkbenchItems(documents: Document[],
                                                  limit: number = 6): KoreanFieldworkWorkbenchItem[] {

    const summary = getKoreanFieldworkTodaySummary(documents);
    const documentsById = new Map(documents.map(document => [document.resource.id, document]));
    const issuesByDocumentId = groupIssuesByDocumentId(summary.openIssues);

    return documents
        .filter(document => WORKBENCH_CATEGORIES.has(document.resource.category))
        .map(document => makeWorkbenchItem(
            document,
            documentsById,
            issuesByDocumentId.get(document.resource.id) ?? []
        ))
        .filter((item): item is KoreanFieldworkWorkbenchItem => !!item)
        .sort(compareWorkbenchItems)
        .slice(0, limit);
}


function makeWorkbenchItem(document: Document,
                           documentsById: Map<string, Document>,
                           issues: KoreanFieldworkReadinessIssue[]): KoreanFieldworkWorkbenchItem|undefined {

    const reasons = getWorkbenchReasons(document, issues);
    if (reasons.length === 0) return undefined;

    return {
        id: document.resource.id,
        documentId: document.resource.id,
        identifier: document.resource.identifier || document.resource.id,
        category: document.resource.category,
        categoryLabel: CATEGORY_LABELS[document.resource.category] ?? document.resource.category,
        parentPath: getParentPath(document, documentsById),
        reasons,
        issueCount: issues.length,
        tone: getWorkbenchTone(document, issues, reasons),
        actionLabel: getWorkbenchActionLabel(document, reasons)
    };
}


function getWorkbenchReasons(document: Document,
                             issues: KoreanFieldworkReadinessIssue[]): string[] {

    const reasons: string[] = [];

    if (issues.length > 0) reasons.push(`확인 ${issues.length}`);

    if (FEATURE_WORKFLOW_CATEGORIES.has(document.resource.category)) {
        const featureRecordingStatus = document.resource.featureRecordingStatus;
        if (featureRecordingStatus === 'candidate') reasons.push('조사 전');
        if (featureRecordingStatus === 'investigating') reasons.push('조사 중');

        const checkedStepCount = getStringArray(document.resource.featureInvestigationChecklist)
            .filter(value => FEATURE_CHECKLIST_STEPS.includes(value))
            .length;
        if (checkedStepCount < FEATURE_CHECKLIST_STEPS.length) {
            reasons.push(`과정 ${checkedStepCount}/${FEATURE_CHECKLIST_STEPS.length}`);
        }
    }

    if (document.resource.verificationState === 'pendingDecision') {
        reasons.push('추가 확인');
    } else if (isTrackedValue(document.resource.verificationState, REVIEW_VERIFICATION_STATES)) {
        reasons.push('재확인');
    }

    if (QUALITY_TRACKED_CATEGORIES.has(document.resource.category)
            && getStringArray(document.resource.fieldRecordQuality).length === 0) {
        reasons.push('기록 보완');
    }

    if (document.resource.category === SOIL_PROFILE_PHOTO_CATEGORY) {
        reasons.push(...getSoilProfilePhotoReasons(document));
    }

    if (document.resource.category === PEN_MEMO_CATEGORY) {
        reasons.push(...getPenMemoReasons(document));
    }

    if (QUALITY_TRACKED_CATEGORIES.has(document.resource.category)
            && !hasTextValue(document.resource.recordCreationTiming)) {
        reasons.push('시점 미입력');
    }

    return dedupe(reasons).slice(0, 4);
}


function getSoilProfilePhotoReasons(document: Document): string[] {

    const reasons: string[] = [];

    switch (document.resource.soilColorAssistStatus) {
        case 'candidatesAvailable':
            reasons.push('토색 후보');
            reasons.push(getMunsellCandidateSummaryLabel(document.resource.soilColorAssistCandidates));
            break;
        case 'lowConfidence':
            reasons.push('토색 재확인');
            reasons.push(getMunsellCandidateSummaryLabel(document.resource.soilColorAssistCandidates));
            break;
    }

    if (!hasSoilProfileColorSwatches(document.resource.soilProfileColorSwatches)) {
        reasons.push('토색 미기록');
    }

    return reasons.filter(reason => reason.length > 0);
}


function getPenMemoReasons(document: Document): string[] {

    const reasons: string[] = [];
    const hasReviewedTranscript = hasTextValue(document.resource.penMemoReviewedTranscript);
    const hasAutoTranscript = hasTextValue(document.resource.penMemoAutoTranscript);
    const hasHandwriting = hasPenMemoHandwriting(document.resource.penMemoStrokes);

    if (!hasReviewedTranscript && hasAutoTranscript && hasHandwriting) {
        reasons.push('태블릿 손글씨·자동 전사');
    } else if (!hasReviewedTranscript && hasAutoTranscript) {
        reasons.push('자동 전사 검토');
    } else if (!hasReviewedTranscript && hasHandwriting) {
        reasons.push('태블릿 손글씨 원자료');
    }

    if (!hasReviewedTranscript && hasHandwriting) {
        reasons.push(getPenMemoSketchSummaryLabel(document.resource.penMemoStrokes));
    }

    return reasons.filter(reason => reason.length > 0);
}


function getWorkbenchTone(document: Document,
                          issues: KoreanFieldworkReadinessIssue[],
                          reasons: string[]): KoreanFieldworkWorkbenchTone {

    if (issues.some(issue => issue.severity === 'critical')) return 'danger';
    if (issues.length > 0) return 'warning';
    if (document.resource.category === PEN_MEMO_CATEGORY) {
        if (reasons.some(isPenMemoReviewReason)) return 'warning';
    }
    if (document.resource.category === SOIL_PROFILE_PHOTO_CATEGORY) {
        if (reasons.includes('토색 재확인') || reasons.includes('토색 미기록')) return 'warning';
        if (reasons.includes('토색 후보')) return 'info';
    }
    if (reasons.includes('조사 전') || reasons.includes('조사 중')) return 'info';
    if (document.resource.category === 'Feature'
            || document.resource.category === 'FeatureSegment') return 'info';

    return 'neutral';
}


function getWorkbenchActionLabel(document: Document, reasons: string[]): string {

    if (document.resource.category === PEN_MEMO_CATEGORY
            && reasons.some(isPenMemoReviewReason)) {
        return '메모 검토';
    }

    return document.resource.category === SOIL_PROFILE_PHOTO_CATEGORY
        && reasons.some(reason => reason.startsWith('토색'))
            ? '토색 검토'
            : '기록 열기';
}


function isPenMemoReviewReason(reason: string): boolean {

    return reason.includes('전사') || reason.includes('손글씨 원자료');
}


function compareWorkbenchItems(itemA: KoreanFieldworkWorkbenchItem,
                               itemB: KoreanFieldworkWorkbenchItem): number {

    return getToneRank(itemB.tone) - getToneRank(itemA.tone)
        || itemB.issueCount - itemA.issueCount
        || getCategoryRank(itemA.category) - getCategoryRank(itemB.category)
        || itemA.identifier.localeCompare(itemB.identifier, 'ko');
}


function getToneRank(tone: KoreanFieldworkWorkbenchTone): number {

    switch (tone) {
        case 'danger':
            return 5;
        case 'warning':
            return 4;
        case 'info':
            return 3;
        case 'success':
            return 2;
        default:
            return 1;
    }
}


function getCategoryRank(categoryName: string): number {

    const index = CATEGORY_ORDER.indexOf(categoryName);
    return index === -1 ? CATEGORY_ORDER.length : index;
}


function groupIssuesByDocumentId(
        issues: KoreanFieldworkReadinessIssue[]
): Map<string, KoreanFieldworkReadinessIssue[]> {

    return issues.reduce((index, issue) => {
        index.set(issue.documentId, (index.get(issue.documentId) ?? []).concat(issue));
        return index;
    }, new Map<string, KoreanFieldworkReadinessIssue[]>());
}


function getParentPath(document: Document,
                       documentsById: Map<string, Document>): string|undefined {

    const path: string[] = [];
    let currentDocument = document;
    const visitedIds = new Set<string>([document.resource.id]);

    for (let depth = 0; depth < 6; depth++) {
        const parentId = getParentIds(currentDocument).find(id => documentsById.has(id));
        if (!parentId || visitedIds.has(parentId)) break;

        const parent = documentsById.get(parentId)!;
        path.unshift(parent.resource.identifier || parent.resource.id);
        visitedIds.add(parentId);
        currentDocument = parent;
    }

    return path.length > 0 ? path.join(' > ') : undefined;
}


function getParentIds(document: Document): string[] {

    const relations = document.resource.relations ?? {};

    return PARENT_RELATIONS.flatMap(relationName => {
        const targets = relations[relationName];
        return Array.isArray(targets)
            ? targets.filter(target => typeof target === 'string')
            : [];
    });
}


function getStringArray(value: unknown): string[] {

    return Array.isArray(value)
        ? value.filter(item => typeof item === 'string')
        : [];
}


function hasTextValue(value: unknown): boolean {

    return typeof value === 'string' && value.trim().length > 0;
}


function hasPenMemoHandwriting(value: unknown): boolean {

    if (typeof value !== 'string') return false;

    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === '[]') return false;

    try {
        const parsedValue = JSON.parse(trimmedValue);
        if (Array.isArray(parsedValue)) return parsedValue.length > 0;
        if (Array.isArray(parsedValue?.strokes)) return parsedValue.strokes.length > 0;
    } catch (_err) {
        return true;
    }

    return false;
}


function hasSoilProfileColorSwatches(value: unknown): boolean {

    if (typeof value !== 'string') return false;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0
        && trimmedValue !== '[]';
}


function isTrackedValue(value: unknown,
                        trackedValues: Set<string>): boolean {

    return typeof value === 'string' && trackedValues.has(value);
}


function dedupe(values: string[]): string[] {

    const seen = new Set<string>();

    return values.filter(value => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}
