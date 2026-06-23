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
  getKoreanFieldworkRecordStatusChips,
  KoreanFieldworkStatusChip,
  KoreanFieldworkStatusTone,
} from './korean-fieldwork-record-summary';

export interface KoreanFieldworkWorkbenchItem {
  id: string;
  document: Document;
  title: string;
  categoryLabel: string;
  parentPath?: string;
  reasons: string[];
  issueCount: number;
  tone: KoreanFieldworkStatusTone;
  statusChips: KoreanFieldworkStatusChip[];
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const WORKBENCH_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
  C.FIND,
  C.FIND_COLLECTION,
  C.SAMPLE,
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
]);

const QUALITY_TRACKED_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
  C.FIND,
  C.FIND_COLLECTION,
  C.SAMPLE,
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
]);

const FEATURE_WORKFLOW_CATEGORIES = new Set<string>([
  C.FEATURE,
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

const CATEGORY_ORDER = [
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
  C.FIND,
  C.FIND_COLLECTION,
  C.SAMPLE,
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
];

export const getKoreanFieldworkWorkbenchItems = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[],
  maxItems = 8
): KoreanFieldworkWorkbenchItem[] => {
  const documentsById = new Map(documents.map((document) => [
    document.resource.id,
    document,
  ]));
  const issuesByDocumentId = groupIssuesByDocumentId(summary.openIssues);

  return documents
    .filter((document) => WORKBENCH_CATEGORIES.has(document.resource.category))
    .map((document) => buildWorkbenchItem(
      document,
      documentsById,
      issuesByDocumentId.get(document.resource.id) ?? []
    ))
    .filter((item): item is KoreanFieldworkWorkbenchItem => !!item)
    .sort(compareWorkbenchItems)
    .slice(0, maxItems);
};

const buildWorkbenchItem = (
  document: Document,
  documentsById: Map<string, Document>,
  issues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkWorkbenchItem | undefined => {
  const reasons = getWorkbenchReasons(document, issues);
  if (reasons.length === 0) return undefined;

  return {
    id: document.resource.id,
    document,
    title: document.resource.identifier || document.resource.id,
    categoryLabel: getKoreanFieldworkCategoryLabel(document.resource.category),
    parentPath: formatKoreanFieldworkParentPath(document, documentsById),
    reasons,
    issueCount: issues.length,
    tone: getWorkbenchTone(document, issues, reasons),
    statusChips: getKoreanFieldworkRecordStatusChips(document),
  };
};

const getWorkbenchReasons = (
  document: Document,
  issues: KoreanFieldworkReadinessIssue[]
): string[] => {
  const resource = getResource(document);
  const reasons: string[] = [];

  if (issues.length > 0) reasons.push(`확인 ${issues.length}`);

  if (FEATURE_WORKFLOW_CATEGORIES.has(document.resource.category)) {
    const featureRecordingStatus = resource.featureRecordingStatus;
    if (featureRecordingStatus === 'candidate') reasons.push('검출 유구');
    if (featureRecordingStatus === 'investigating') reasons.push('조사 진행');

    const checkedStepCount = getStringArray(resource.featureInvestigationChecklist)
      .filter((value) => FEATURE_CHECKLIST_STEPS.includes(value))
      .length;
    if (checkedStepCount < FEATURE_CHECKLIST_STEPS.length) {
      reasons.push(`과정 ${checkedStepCount}/${FEATURE_CHECKLIST_STEPS.length}`);
    }
  }

  if (QUALITY_TRACKED_CATEGORIES.has(document.resource.category)
      && getStringArray(resource.fieldRecordQuality).length === 0) {
    reasons.push('기록 보완');
  }

  if (!hasTextValue(resource.recordCreationTiming)) {
    reasons.push('시점 미입력');
  }

  return dedupe(reasons).slice(0, 4);
};

const getWorkbenchTone = (
  document: Document,
  issues: KoreanFieldworkReadinessIssue[],
  reasons: string[]
): KoreanFieldworkStatusTone => {
  if (issues.some((issue) => issue.severity === 'critical')) return 'danger';
  if (issues.length > 0) return 'warning';
  if (reasons.includes('검출 유구') || reasons.includes('조사 진행')) return 'info';
  if (document.resource.category === C.FEATURE
      || document.resource.category === C.FEATURE_SEGMENT) return 'info';

  return 'neutral';
};

const compareWorkbenchItems = (
  a: KoreanFieldworkWorkbenchItem,
  b: KoreanFieldworkWorkbenchItem
): number =>
  getToneRank(b.tone) - getToneRank(a.tone)
  || b.issueCount - a.issueCount
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
  const index = CATEGORY_ORDER.indexOf(categoryName);
  return index === -1 ? CATEGORY_ORDER.length : index;
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

const dedupe = (values: string[]): string[] => {
  const seen = new Set<string>();

  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};
