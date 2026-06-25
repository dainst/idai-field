import { buildEvidenceBundle, Document } from 'idai-field-core';


export type KoreanFieldworkProgressTone = 'success'|'warning'|'info'|'danger'|'neutral';

export type KoreanFieldworkProgressStage =
    '착수'
    | '조사'
    | '자료'
    | '보완'
    | '마감';

export interface KoreanFieldworkProgressItem {
    id: string;
    documentId: string;
    identifier: string;
    category: string;
    categoryLabel: string;
    parentPath?: string;
    stage: KoreanFieldworkProgressStage;
    stageIndex: number;
    tone: KoreanFieldworkProgressTone;
    detail: string;
    actionLabel: string;
    childCount: number;
    evidenceCount: number;
    issueCount: number;
    checklistDone: number;
    checklistTotal: number;
}

const PROGRESS_CATEGORIES = new Set<string>([
    'Operation',
    'Trench',
    'FeatureGroup',
    'Feature',
    'FeatureSegment'
]);

const FEATURE_PARENT_CATEGORIES = new Set<string>([
    'Trench',
    'FeatureGroup'
]);

const PARENT_RELATIONS = ['liesWithin', 'isRecordedInFeature', 'isRecordedIn'];
const STAGE_ORDER: KoreanFieldworkProgressStage[] = ['착수', '조사', '자료', '보완', '마감'];
const CATEGORY_ORDER = ['Operation', 'Trench', 'FeatureGroup', 'Feature', 'FeatureSegment'];

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
    Operation: '조사',
    Trench: '트렌치',
    FeatureGroup: '유구군',
    Feature: '유구',
    FeatureSegment: '세부 단위'
};


export function makeKoreanFieldworkProgressItems(documents: Document[],
                                                 limit: number = 6,
                                                 investigationMode?: string): KoreanFieldworkProgressItem[] {

    const documentsById = new Map(documents.map(document => [document.resource.id, document]));
    const childrenByParentId = getChildrenByParentId(documents);

    return documents
        .filter(document => PROGRESS_CATEGORIES.has(document.resource.category))
        .map(document => makeProgressItem(document, documents, documentsById, childrenByParentId, investigationMode))
        .sort(compareProgressItems)
        .slice(0, limit);
}


function makeProgressItem(document: Document,
                          documents: Document[],
                          documentsById: Map<string, Document>,
                          childrenByParentId: Map<string, Document[]>,
                          investigationMode?: string): KoreanFieldworkProgressItem {

    const children = childrenByParentId.get(document.resource.id) ?? [];
    const descendants = getDescendants(document, childrenByParentId);
    const evidenceBundle = buildEvidenceBundle(document, documents);
    const evidenceCount = evidenceBundle.photos.length
        + evidenceBundle.soilProfilePhotos.length
        + evidenceBundle.drawings.length
        + evidenceBundle.finds.length
        + evidenceBundle.samples.length;
    const issueCount = evidenceBundle.issues.length;
    const checklistValues = getStringArray(document.resource.featureInvestigationChecklist);
    const checklistTotal = checklistValues.length > 0 || isFeatureLike(document)
        ? checklistValues.length
        : 0;
    const checklistDone = checklistValues.filter(value => value !== 'pendingDecision').length;
    const stage = getStage(
        document,
        children,
        descendants,
        issueCount,
        evidenceCount,
        checklistDone,
        checklistTotal,
        investigationMode
    );

    return {
        id: document.resource.id,
        documentId: document.resource.id,
        identifier: document.resource.identifier || document.resource.id,
        category: document.resource.category,
        categoryLabel: CATEGORY_LABELS[document.resource.category] ?? document.resource.category,
        parentPath: getParentPath(document, documentsById),
        ...stage,
        childCount: children.filter(child => PROGRESS_CATEGORIES.has(child.resource.category)).length,
        evidenceCount,
        issueCount,
        checklistDone,
        checklistTotal
    };
}


function getStage(document: Document,
                  children: Document[],
                  descendants: Document[],
                  issueCount: number,
                  evidenceCount: number,
                  checklistDone: number,
                  checklistTotal: number,
                  investigationMode?: string): Pick<KoreanFieldworkProgressItem,
                      'stage'|'stageIndex'|'tone'|'detail'|'actionLabel'> {

    if (issueCount > 0) {
        return toStage(
            '보완',
            'warning',
            `마감 전 확인 ${issueCount}건을 먼저 처리해야 합니다.`,
            '점검 열기'
        );
    }

    if (document.resource.category === 'Operation'
            && investigationMode === 'excavation'
            && !descendants.some(descendant => descendant.resource.category === 'Feature')) {
        return toStage(
            '조사',
            'warning',
            '제토 뒤 확인한 유구를 조사 경계 안에 먼저 기록하세요.',
            '유구 기록'
        );
    }

    if (document.resource.category === 'Operation'
            && !descendants.some(descendant => descendant.resource.category === 'Trench')) {
        return toStage(
            '착수',
            'warning',
            '조사 경계 안에 트렌치 또는 조사 범위를 먼저 정해야 합니다.',
            '조사 열기'
        );
    }

    if (FEATURE_PARENT_CATEGORIES.has(document.resource.category)
            && !children.some(child => child.resource.category === 'Feature'
                || child.resource.category === 'FeatureGroup')) {
        return toStage(
            '조사',
            'info',
            '이 범위에서 확인된 유구를 이어서 기록하세요.',
            '범위 열기'
        );
    }

    if (isOpenFeatureRecord(document) || (checklistTotal > 0 && checklistDone < checklistTotal)) {
        return toStage(
            '조사',
            isOpenFeatureRecord(document) ? 'warning' : 'info',
            checklistTotal > 0
                ? `조사 과정 ${checklistDone}/${checklistTotal}을 현장에서 확인하세요.`
                : '유구 경계와 조사 상태를 이어서 기록하세요.',
            '기록 열기'
        );
    }

    if (isFeatureLike(document) && evidenceCount === 0) {
        return toStage(
            '자료',
            'warning',
            '사진·도면·스케치·유물·시료 근거가 아직 연결되지 않았습니다.',
            '자료 확인'
        );
    }

    return toStage(
        '마감',
        'success',
        '현재 이어진 조사 구역 기록으로 마감 흐름이 안정적입니다.',
        '기록 열기'
    );
}


function toStage(stage: KoreanFieldworkProgressStage,
                 tone: KoreanFieldworkProgressTone,
                 detail: string,
                 actionLabel: string): Pick<KoreanFieldworkProgressItem,
                     'stage'|'stageIndex'|'tone'|'detail'|'actionLabel'> {

    return {
        stage,
        stageIndex: STAGE_ORDER.indexOf(stage),
        tone,
        detail,
        actionLabel
    };
}


function compareProgressItems(itemA: KoreanFieldworkProgressItem,
                              itemB: KoreanFieldworkProgressItem): number {

    return getTonePriority(itemA.tone) - getTonePriority(itemB.tone)
        || itemA.stageIndex - itemB.stageIndex
        || CATEGORY_ORDER.indexOf(itemA.category) - CATEGORY_ORDER.indexOf(itemB.category)
        || itemA.identifier.localeCompare(itemB.identifier, 'ko');
}


function getTonePriority(tone: KoreanFieldworkProgressTone): number {

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


function getChildrenByParentId(documents: Document[]): Map<string, Document[]> {

    const childrenByParentId = new Map<string, Document[]>();

    for (const document of documents) {
        const parentIds = getParentIds(document);
        for (const parentId of parentIds) {
            const children = childrenByParentId.get(parentId) ?? [];
            children.push(document);
            childrenByParentId.set(parentId, children);
        }
    }

    return childrenByParentId;
}


function getDescendants(document: Document,
                        childrenByParentId: Map<string, Document[]>): Document[] {

    const descendants: Document[] = [];
    const visitedIds = new Set<string>([document.resource.id]);
    const queue = [...(childrenByParentId.get(document.resource.id) ?? [])];

    while (queue.length > 0) {
        const descendant = queue.shift()!;
        if (visitedIds.has(descendant.resource.id)) continue;

        visitedIds.add(descendant.resource.id);
        descendants.push(descendant);
        queue.push(...(childrenByParentId.get(descendant.resource.id) ?? []));
    }

    return descendants;
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

    return PARENT_RELATIONS
        .flatMap(relationName => {
            const targets = relations[relationName];
            return Array.isArray(targets)
                ? targets.filter(target => typeof target === 'string')
                : [];
        });
}


function isOpenFeatureRecord(document: Document): boolean {

    const status = document.resource.featureRecordingStatus;

    return status === 'candidate' || status === 'investigating';
}


function isFeatureLike(document: Document): boolean {

    return document.resource.category === 'Feature'
        || document.resource.category === 'FeatureGroup'
        || document.resource.category === 'FeatureSegment';
}


function getStringArray(value: unknown): string[] {

    return Array.isArray(value)
        ? value.filter(item => typeof item === 'string')
        : [];
}
