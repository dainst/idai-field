import {
  Document,
  KoreanFieldworkReadinessIssue,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import {
  formatKoreanFieldworkParentPath,
  getKoreanFieldworkPrimaryParent,
  KoreanFieldworkStatusTone,
} from './korean-fieldwork-record-summary';
import { getKoreanFieldworkEvidenceChips } from './korean-fieldwork-record-evidence';

const C = KOREAN_FIELDWORK_CATEGORIES;

export type KoreanFieldworkProgressStageId =
  'setup'
  | 'investigation'
  | 'evidence'
  | 'review'
  | 'closeout';

export type KoreanFieldworkProgressAction =
  | { type: 'openDocument'; documentId: string }
  | { type: 'createDocument'; parentDocumentId: string; categoryName: string }
  | { type: 'openMap' };

export interface KoreanFieldworkProgressStage {
  id: KoreanFieldworkProgressStageId;
  label: string;
}

export interface KoreanFieldworkProgressMetrics {
  hierarchyCount: number;
  evidenceCount: number;
  issueCount: number;
  checklistDone: number;
  checklistTotal: number;
}

export interface KoreanFieldworkProgressItem {
  id: string;
  document: Document;
  title: string;
  categoryLabel: string;
  parentPath?: string;
  stageId: KoreanFieldworkProgressStageId;
  stageLabel: string;
  stageIndex: number;
  tone: KoreanFieldworkStatusTone;
  detail: string;
  actionLabel: string;
  action: KoreanFieldworkProgressAction;
  metrics: KoreanFieldworkProgressMetrics;
}

export const KOREAN_FIELDWORK_PROGRESS_STAGES: KoreanFieldworkProgressStage[] = [
  { id: 'setup', label: '착수' },
  { id: 'investigation', label: '조사' },
  { id: 'evidence', label: '자료' },
  { id: 'review', label: '보완' },
  { id: 'closeout', label: '마감' },
];

const PROGRESS_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
]);

const HIERARCHY_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
]);

const FEATURE_WORKFLOW_CATEGORIES = new Set<string>([
  C.FEATURE,
  C.FEATURE_GROUP,
  C.FEATURE_SEGMENT,
]);

const FEATURE_CHECKLIST_STEPS = [
  'preInvestigationPhotoTaken',
  'inProgressPhotoTaken',
  'soilProfilePhotoLinked',
  'measuredDrawingCompleted',
  'preRecoveryFindPhotoTaken',
  'findsRecovered',
  'samplesCollected',
  'completionPhotoTaken',
];

const EVIDENCE_CHIP_IDS = new Set<string>([
  'photos',
  'soilProfilePhotos',
  'drawings',
  'finds',
  'samples',
]);

export const getKoreanFieldworkProgressItems = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[],
  maxItems = 8
): KoreanFieldworkProgressItem[] => {
  const documentsById = new Map(documents.map((document) => [
    document.resource.id,
    document,
  ]));
  const childrenByParentId = getChildrenByParentId(documents, documentsById);
  const issuesByDocumentId = groupIssuesByDocumentId(summary.openIssues);

  return documents
    .filter((document) => PROGRESS_CATEGORIES.has(document.resource.category))
    .map((document) => buildProgressItem(
      document,
      documents,
      documentsById,
      childrenByParentId,
      issuesByDocumentId
    ))
    .sort(compareProgressItems)
    .slice(0, maxItems);
};

const buildProgressItem = (
  document: Document,
  documents: Document[],
  documentsById: Map<string, Document>,
  childrenByParentId: Map<string, Document[]>,
  issuesByDocumentId: Map<string, KoreanFieldworkReadinessIssue[]>
): KoreanFieldworkProgressItem => {
  const descendants = getDescendants(document, childrenByParentId);
  const scopedDocuments = [document, ...descendants];
  const scopedDocumentIds = new Set(scopedDocuments.map((doc) => doc.resource.id));
  const scopedIssues = Array.from(scopedDocumentIds)
    .flatMap((documentId) => issuesByDocumentId.get(documentId) ?? []);
  const firstIssue = scopedIssues[0];
  const metrics = getProgressMetrics(document, scopedDocuments, documents, scopedIssues);
  const stage = getProgressStage(document, descendants, scopedIssues, metrics);

  return {
    id: document.resource.id,
    document,
    title: document.resource.identifier || document.resource.id,
    categoryLabel: getKoreanFieldworkCategoryLabel(document.resource.category),
    parentPath: formatKoreanFieldworkParentPath(document, documentsById),
    ...stage,
    action: getProgressAction(document, descendants, firstIssue, stage.stageId),
    metrics,
  };
};

const getProgressStage = (
  document: Document,
  descendants: Document[],
  issues: KoreanFieldworkReadinessIssue[],
  metrics: KoreanFieldworkProgressMetrics
): Omit<KoreanFieldworkProgressItem, 'id'|'document'|'title'|'categoryLabel'|'parentPath'|'action'|'metrics'> => {
  const resource = getResource(document);
  const issueCount = issues.length;
  const hasCriticalIssue = issues.some((issue) => issue.severity === 'critical');

  if (issueCount > 0) {
    return toStage(
      'review',
      hasCriticalIssue ? 'danger' : 'warning',
      `마감 전 확인 ${issueCount}건을 먼저 처리하세요.`,
      '확인하기'
    );
  }

  if (
    document.resource.category === C.OPERATION
    && !descendants.some((descendant) => descendant.resource.category === C.TRENCH)
  ) {
    return toStage(
      'setup',
      'warning',
      '조사구역 아래에 트렌치를 먼저 잡아야 후속 기록이 이어집니다.',
      '트렌치 추가'
    );
  }

  if (
    [C.TRENCH, C.FEATURE_GROUP].includes(document.resource.category)
    && !descendants.some((descendant) => (
      descendant.resource.category === C.FEATURE
      || descendant.resource.category === C.FEATURE_GROUP
    ))
  ) {
    return toStage(
      'investigation',
      'info',
      '이 범위에서 확인되는 유구 후보를 먼저 추가하세요.',
      '유구 후보 추가'
    );
  }

  if (isFeatureWorkflowDocument(document)) {
    const recordingStatus = resource.featureRecordingStatus;
    const isOpenFeatureStatus = recordingStatus === 'candidate'
      || recordingStatus === 'investigating';
    const checklistIsOpen = metrics.checklistTotal > 0
      && metrics.checklistDone < metrics.checklistTotal;

    if (isOpenFeatureStatus || checklistIsOpen) {
      return toStage(
        'investigation',
        recordingStatus === 'candidate' ? 'warning' : 'info',
        metrics.checklistTotal > 0
          ? `조사 과정 ${metrics.checklistDone}/${metrics.checklistTotal}을 현장에서 확인하세요.`
          : '유구 후보의 경계와 충전토를 이어서 기록하세요.',
        '조사 과정 열기'
      );
    }
  }

  if (metrics.evidenceCount === 0) {
    return toStage(
      'evidence',
      'warning',
      '사진·도면·유물·시료 근거가 아직 연결되지 않았습니다.',
      '사진 추가'
    );
  }

  const reviewReasons = getReviewReasons(resource);
  if (reviewReasons.length > 0) {
    return toStage(
      'review',
      'warning',
      `${reviewReasons.join(', ')} 항목을 보완하세요.`,
      '기록 보완'
    );
  }

  return toStage(
    'closeout',
    'success',
    '현재 연결된 기록 기준으로 현장 마감 흐름이 갖춰져 있습니다.',
    '기록 열기'
  );
};

const toStage = (
  stageId: KoreanFieldworkProgressStageId,
  tone: KoreanFieldworkStatusTone,
  detail: string,
  actionLabel: string
) => {
  const stageIndex = KOREAN_FIELDWORK_PROGRESS_STAGES
    .findIndex((stage) => stage.id === stageId);

  return {
    stageId,
    stageLabel: KOREAN_FIELDWORK_PROGRESS_STAGES[stageIndex].label,
    stageIndex,
    tone,
    detail,
    actionLabel,
  };
};

const getProgressAction = (
  document: Document,
  descendants: Document[],
  firstIssue: KoreanFieldworkReadinessIssue | undefined,
  stageId: KoreanFieldworkProgressStageId
): KoreanFieldworkProgressAction => {
  if (firstIssue) {
    return { type: 'openDocument', documentId: firstIssue.documentId };
  }

  if (stageId === 'setup' && document.resource.category === C.OPERATION) {
    return {
      type: 'createDocument',
      parentDocumentId: document.resource.id,
      categoryName: C.TRENCH,
    };
  }

  if (stageId === 'investigation') {
    if ([C.TRENCH, C.FEATURE_GROUP].includes(document.resource.category)) {
      return {
        type: 'createDocument',
        parentDocumentId: document.resource.id,
        categoryName: C.FEATURE,
      };
    }

    return { type: 'openDocument', documentId: document.resource.id };
  }

  if (stageId === 'evidence') {
    const evidenceParent = document.resource.category === C.OPERATION
      ? descendants.find((descendant) => descendant.resource.category === C.TRENCH)
      : undefined;

    return {
      type: 'createDocument',
      parentDocumentId: evidenceParent?.resource.id ?? document.resource.id,
      categoryName: C.PHOTO,
    };
  }

  return { type: 'openDocument', documentId: document.resource.id };
};

const getProgressMetrics = (
  document: Document,
  scopedDocuments: Document[],
  allDocuments: Document[],
  issues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkProgressMetrics => {
  const featureWorkflowDocuments = scopedDocuments.filter(isFeatureWorkflowDocument);
  const checklistTotal = featureWorkflowDocuments.length * FEATURE_CHECKLIST_STEPS.length;
  const checklistDone = featureWorkflowDocuments.reduce((count, featureDocument) =>
    count + getChecklistDoneCount(featureDocument), 0);

  return {
    hierarchyCount: scopedDocuments
      .filter((scopedDocument) =>
        scopedDocument.resource.id !== document.resource.id
        && HIERARCHY_CATEGORIES.has(scopedDocument.resource.category)
      ).length,
    evidenceCount: getEvidenceCount(document, allDocuments),
    issueCount: issues.length,
    checklistDone,
    checklistTotal,
  };
};

const getEvidenceCount = (
  document: Document,
  documents: Document[]
): number => getKoreanFieldworkEvidenceChips(document, documents)
  .filter((chip) => EVIDENCE_CHIP_IDS.has(chip.id))
  .reduce((count, chip) => count + chip.count, 0);

const getChildrenByParentId = (
  documents: Document[],
  documentsById: Map<string, Document>
): Map<string, Document[]> => {
  const childrenByParentId = new Map<string, Document[]>();

  documents.forEach((document) => {
    const parent = getKoreanFieldworkPrimaryParent(document, documentsById);
    if (!parent) return;

    childrenByParentId.set(
      parent.resource.id,
      (childrenByParentId.get(parent.resource.id) ?? []).concat(document)
    );
  });

  return childrenByParentId;
};

const getDescendants = (
  document: Document,
  childrenByParentId: Map<string, Document[]>
): Document[] => {
  const descendants: Document[] = [];
  const visitedIds = new Set<string>([document.resource.id]);
  const stack = [...(childrenByParentId.get(document.resource.id) ?? [])];

  while (stack.length > 0) {
    const child = stack.shift();
    if (!child || visitedIds.has(child.resource.id)) continue;

    visitedIds.add(child.resource.id);
    descendants.push(child);
    stack.push(...(childrenByParentId.get(child.resource.id) ?? []));
  }

  return descendants;
};

const groupIssuesByDocumentId = (
  issues: KoreanFieldworkReadinessIssue[]
): Map<string, KoreanFieldworkReadinessIssue[]> =>
  issues.reduce((index, issue) => {
    index.set(
      issue.documentId,
      (index.get(issue.documentId) ?? []).concat(issue)
    );
    return index;
  }, new Map<string, KoreanFieldworkReadinessIssue[]>());

const getReviewReasons = (
  resource: Record<string, unknown>
): string[] => {
  const reasons: string[] = [];

  if (Array.isArray(resource.fieldRecordQuality)
      && resource.fieldRecordQuality.length === 0) {
    reasons.push('기록');
  }
  if (!hasTextValue(resource.recordCreationTiming)) {
    reasons.push('시점');
  }

  return reasons;
};

const getChecklistDoneCount = (document: Document): number =>
  getStringArray(getResource(document).featureInvestigationChecklist)
    .filter((value) => FEATURE_CHECKLIST_STEPS.includes(value))
    .length;

const isFeatureWorkflowDocument = (document: Document): boolean =>
  FEATURE_WORKFLOW_CATEGORIES.has(document.resource.category);

const getResource = (
  document: Document
): Record<string, unknown> =>
  document.resource as unknown as Record<string, unknown>;

const getStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];

const hasTextValue = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const compareProgressItems = (
  a: KoreanFieldworkProgressItem,
  b: KoreanFieldworkProgressItem
): number =>
  getToneRank(b.tone) - getToneRank(a.tone)
  || a.stageIndex - b.stageIndex
  || b.metrics.issueCount - a.metrics.issueCount
  || getCategoryRank(a.document.resource.category) - getCategoryRank(b.document.resource.category)
  || a.title.localeCompare(b.title);

const getToneRank = (tone: KoreanFieldworkStatusTone): number => {
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
};

const getCategoryRank = (categoryName: string): number => {
  const index = [
    C.OPERATION,
    C.TRENCH,
    C.FEATURE_GROUP,
    C.FEATURE,
    C.FEATURE_SEGMENT,
  ].indexOf(categoryName);

  return index === -1 ? 99 : index;
};
