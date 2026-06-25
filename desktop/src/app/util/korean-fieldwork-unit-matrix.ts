import {
    buildEvidenceBundle,
    Document,
    getKoreanFieldworkTodaySummary,
    KoreanFieldworkReadinessIssue,
    ProjectConfiguration
} from 'idai-field-core';
import {
    getKoreanFieldworkProjectResourceValue,
    KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
} from './korean-fieldwork-project-setup';
import {
    canCreateKoreanFieldworkChildRecord,
    getKoreanFieldworkContinuationActions
} from './korean-fieldwork-document-drafts';


export type KoreanFieldworkUnitMatrixTone = 'danger'|'warning'|'info'|'success'|'neutral';

export interface KoreanFieldworkUnitMatrixItem {
    id: string;
    documentId: string;
    identifier: string;
    category: string;
    categoryLabel: string;
    parentPath?: string;
    childStructureCount: number;
    evidenceCount: number;
    issueCount: number;
    hasCriticalIssue: boolean;
    checklistDone: number;
    checklistTotal: number;
    completionPercent: number;
    tone: KoreanFieldworkUnitMatrixTone;
    nextChildCategoryName?: string;
    photoCategoryName?: string;
}

export interface KoreanFieldworkFeatureOverviewItem extends KoreanFieldworkUnitMatrixItem {
    statusLabel: string;
    evidenceLabel: string;
    nextActionLabel: string;
}

const UNIT_CATEGORIES = [
    'Operation',
    'Trench',
    'Feature',
    'FeatureSegment',
    'Layer'
];

const UNIT_CATEGORY_SET = new Set<string>(UNIT_CATEGORIES);
const PARENT_RELATIONS = ['liesWithin', 'isRecordedInFeature', 'isRecordedIn'];

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
    Feature: '유구',
    FeatureSegment: '세부 단위',
    Layer: '토층',
    Operation: '조사 구역 기록',
    Trench: '트렌치'
};

const DEFAULT_CHECKLIST_STEPS = [
    'preInvestigationPhotoTaken',
    'inProgressPhotoTaken',
    'soilProfilePhotoLinked',
    'measuredDrawingCompleted',
    'preRecoveryFindPhotoTaken',
    'findsRecovered',
    'samplesCollected',
    'completionPhotoTaken'
];

const TRIAL_TRENCH_CHECKLIST_STEPS = [
    'trenchSoilCleaned',
    'trenchFeatureChecked',
    'trenchPhotoTaken',
    'trenchDrawingCompleted',
    'trenchSoilProfilePhotoLinked',
    'trenchLayerRecorded',
    'trenchFindsChecked',
    'trenchSamplesChecked',
    'completionPhotoTaken'
];


export function makeKoreanFieldworkUnitMatrixItems(documents: Document[],
                                                   projectDocument: Document|undefined,
                                                   projectConfiguration: ProjectConfiguration,
                                                   limit: number = 10): KoreanFieldworkUnitMatrixItem[] {

    const documentsById = new Map(documents.map(document => [document.resource.id, document]));
    const childrenByParentId = getChildrenByParentId(documents, documentsById);
    const issuesByDocumentId = groupIssuesByDocumentId(
        getKoreanFieldworkTodaySummary(documents).openIssues
    );
    const investigationMode = projectDocument
        ? getKoreanFieldworkProjectResourceValue(projectDocument, KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD)
        : undefined;

    return documents
        .filter(document => UNIT_CATEGORY_SET.has(document.resource.category))
        .map(document => makeUnitMatrixItem(
            document,
            documents,
            documentsById,
            childrenByParentId,
            issuesByDocumentId.get(document.resource.id) ?? [],
            investigationMode,
            projectConfiguration
        ))
        .sort(compareUnitMatrixItems)
        .slice(0, limit);
}


export function makeKoreanFieldworkFeatureOverviewItems(documents: Document[],
                                                        projectDocument: Document|undefined,
                                                        projectConfiguration: ProjectConfiguration,
                                                        limit: number = 80): KoreanFieldworkFeatureOverviewItem[] {

    return makeKoreanFieldworkUnitMatrixItems(
        documents,
        projectDocument,
        projectConfiguration,
        Number.MAX_SAFE_INTEGER
    )
        .filter(item => item.category === 'Feature')
        .sort(compareFeatureOverviewItems)
        .slice(0, limit)
        .map(toFeatureOverviewItem);
}


function makeUnitMatrixItem(document: Document,
                            documents: Document[],
                            documentsById: Map<string, Document>,
                            childrenByParentId: Map<string, Document[]>,
                            issues: KoreanFieldworkReadinessIssue[],
                            investigationMode: string|undefined,
                            projectConfiguration: ProjectConfiguration): KoreanFieldworkUnitMatrixItem {

    const directChildren = childrenByParentId.get(document.resource.id) ?? [];
    const childStructureCount = directChildren.filter(child =>
        UNIT_CATEGORY_SET.has(child.resource.category)
    ).length;
    const evidenceBundle = buildEvidenceBundle(document, documents);
    const evidenceCount = evidenceBundle.photos.length
        + evidenceBundle.soilProfilePhotos.length
        + evidenceBundle.drawings.length
        + evidenceBundle.finds.length
        + evidenceBundle.samples.length;
    const checklistSteps = getChecklistSteps(document.resource.category, investigationMode);
    const checklistTotal = checklistSteps.length;
    const checklistDone = checklistTotal > 0
        ? getStringArray(document.resource.featureInvestigationChecklist)
            .filter(value => checklistSteps.includes(value)).length
        : 0;
    const nextChildCategoryName = getNextChildCategoryName(
        document.resource.category,
        investigationMode
    );
    const continuationCategoryNames = getKoreanFieldworkContinuationActions(
        document,
        projectConfiguration
    ).map(action => action.categoryName);
    const actionableNextChildCategoryName = nextChildCategoryName
        && canCreateCategory(nextChildCategoryName, document, projectConfiguration)
            ? nextChildCategoryName
            : undefined;
    const photoCategoryName = continuationCategoryNames.includes('Photo') ? 'Photo' : undefined;
    const hasCriticalIssue = issues.some(issue => issue.severity === 'critical');
    const completionPercent = getCompletionPercent(
        childStructureCount,
        evidenceCount,
        issues.length,
        checklistDone,
        checklistTotal,
        !!nextChildCategoryName
    );

    return {
        id: document.resource.id,
        documentId: document.resource.id,
        identifier: document.resource.identifier || document.resource.id,
        category: document.resource.category,
        categoryLabel: CATEGORY_LABELS[document.resource.category] ?? document.resource.category,
        parentPath: getParentPath(document, documentsById),
        childStructureCount,
        evidenceCount,
        issueCount: issues.length,
        hasCriticalIssue,
        checklistDone,
        checklistTotal,
        completionPercent,
        tone: getTone(hasCriticalIssue, issues.length, completionPercent, evidenceCount),
        nextChildCategoryName: actionableNextChildCategoryName,
        photoCategoryName
    };
}


function toFeatureOverviewItem(item: KoreanFieldworkUnitMatrixItem): KoreanFieldworkFeatureOverviewItem {

    return {
        ...item,
        statusLabel: getFeatureOverviewStatusLabel(item),
        evidenceLabel: getFeatureOverviewEvidenceLabel(item),
        nextActionLabel: getFeatureOverviewNextActionLabel(item)
    };
}


function getFeatureOverviewStatusLabel(item: KoreanFieldworkUnitMatrixItem): string {

    if (item.hasCriticalIssue) return '필수 보완';
    if (item.issueCount > 0) return '보완 필요';
    if (item.evidenceCount === 0) return '근거자료 없음';
    if (item.checklistTotal > 0 && item.checklistDone < item.checklistTotal) return '조사 중';
    if (item.completionPercent >= 100) return '정리됨';

    return '검토 중';
}


function getFeatureOverviewEvidenceLabel(item: KoreanFieldworkUnitMatrixItem): string {

    return item.evidenceCount > 0 ? `근거자료 ${item.evidenceCount}` : '없음';
}


function getFeatureOverviewNextActionLabel(item: KoreanFieldworkUnitMatrixItem): string {

    if (item.issueCount > 0) return '보완 항목 확인';
    if (item.evidenceCount === 0) return '사진·스케치 연결';
    if (item.checklistTotal > 0 && item.checklistDone < item.checklistTotal) {
        return `조사 과정 ${item.checklistDone}/${item.checklistTotal}`;
    }
    if (item.nextChildCategoryName) {
        return `${CATEGORY_LABELS[item.nextChildCategoryName] ?? item.nextChildCategoryName} 추가`;
    }

    return '검토 완료';
}


function getCompletionPercent(childStructureCount: number,
                              evidenceCount: number,
                              issueCount: number,
                              checklistDone: number,
                              checklistTotal: number,
                              needsChildStructure: boolean): number {

    const checks = [
        issueCount === 0,
        evidenceCount > 0
    ];

    if (needsChildStructure) checks.push(childStructureCount > 0);
    if (checklistTotal > 0) checks.push(checklistDone >= checklistTotal);

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}


function getTone(hasCriticalIssue: boolean,
                 issueCount: number,
                 completionPercent: number,
                 evidenceCount: number): KoreanFieldworkUnitMatrixTone {

    if (hasCriticalIssue) return 'danger';
    if (issueCount > 0 || evidenceCount === 0 || completionPercent < 50) return 'warning';
    if (completionPercent < 100) return 'info';

    return 'success';
}


function getNextChildCategoryName(categoryName: string,
                                  investigationMode: string|undefined): string|undefined {

    if (categoryName === 'Operation') return investigationMode === 'excavation' ? 'Feature' : 'Trench';
    if (categoryName === 'Trench') return 'Feature';
    if (categoryName === 'Feature') return 'FeatureSegment';
    if (categoryName === 'FeatureSegment') return 'Layer';

    return undefined;
}


function canCreateCategory(categoryName: string,
                           parentDocument: Document,
                           projectConfiguration: ProjectConfiguration): boolean {

    try {
        const category = projectConfiguration.getCategory(categoryName);
        return canCreateKoreanFieldworkChildRecord(category, parentDocument, projectConfiguration);
    } catch (_) {
        return false;
    }
}


function getChecklistSteps(categoryName: string, investigationMode: string|undefined): string[] {

    if (categoryName === 'Trench' && investigationMode === 'trialTrench') {
        return TRIAL_TRENCH_CHECKLIST_STEPS;
    }

    return categoryName === 'Feature' || categoryName === 'FeatureSegment'
        ? DEFAULT_CHECKLIST_STEPS
        : [];
}


function getChildrenByParentId(documents: Document[],
                               documentsById: Map<string, Document>): Map<string, Document[]> {

    const childrenByParentId = new Map<string, Document[]>();

    documents.forEach(document => {
        const parent = getPrimaryParent(document, documentsById);
        if (!parent) return;

        childrenByParentId.set(
            parent.resource.id,
            (childrenByParentId.get(parent.resource.id) ?? []).concat(document)
        );
    });

    return childrenByParentId;
}


function getPrimaryParent(document: Document,
                          documentsById: Map<string, Document>): Document|undefined {

    for (const relationName of PARENT_RELATIONS) {
        const targets = document.resource.relations?.[relationName];
        if (!Array.isArray(targets)) continue;

        const parentId = targets.find(target => typeof target === 'string' && documentsById.has(target));
        if (parentId) return documentsById.get(parentId);
    }

    return undefined;
}


function getParentPath(document: Document,
                       documentsById: Map<string, Document>): string|undefined {

    const path: string[] = [];
    let currentDocument = document;
    const visitedIds = new Set<string>([document.resource.id]);

    for (let depth = 0; depth < 6; depth++) {
        const parent = getPrimaryParent(currentDocument, documentsById);
        if (!parent || visitedIds.has(parent.resource.id)) break;

        path.unshift(parent.resource.identifier || parent.resource.id);
        visitedIds.add(parent.resource.id);
        currentDocument = parent;
    }

    return path.length > 0 ? path.join(' > ') : undefined;
}


function groupIssuesByDocumentId(
        issues: KoreanFieldworkReadinessIssue[]
): Map<string, KoreanFieldworkReadinessIssue[]> {

    return issues.reduce((index, issue) => {
        index.set(issue.documentId, (index.get(issue.documentId) ?? []).concat(issue));
        return index;
    }, new Map<string, KoreanFieldworkReadinessIssue[]>());
}


function compareUnitMatrixItems(itemA: KoreanFieldworkUnitMatrixItem,
                                itemB: KoreanFieldworkUnitMatrixItem): number {

    return getTonePriority(itemA.tone) - getTonePriority(itemB.tone)
        || getCategoryRank(itemA.category) - getCategoryRank(itemB.category)
        || (itemA.parentPath ?? '').localeCompare(itemB.parentPath ?? '', 'ko')
        || itemA.identifier.localeCompare(itemB.identifier, 'ko');
}


function getTonePriority(tone: KoreanFieldworkUnitMatrixTone): number {

    switch (tone) {
        case 'danger':
            return 0;
        case 'warning':
            return 1;
        case 'info':
            return 2;
        case 'neutral':
            return 3;
        case 'success':
            return 4;
    }
}


function getCategoryRank(categoryName: string): number {

    const index = UNIT_CATEGORIES.indexOf(categoryName);
    return index === -1 ? UNIT_CATEGORIES.length : index;
}


function compareFeatureOverviewItems(itemA: KoreanFieldworkUnitMatrixItem,
                                     itemB: KoreanFieldworkUnitMatrixItem): number {

    return (itemA.parentPath ?? '').localeCompare(itemB.parentPath ?? '', 'ko')
        || itemA.identifier.localeCompare(itemB.identifier, 'ko');
}


function getStringArray(value: unknown): string[] {

    return Array.isArray(value)
        ? value.filter(item => typeof item === 'string')
        : [];
}
