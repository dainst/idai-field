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
  getKoreanFieldworkRecordStatusChips,
  KoreanFieldworkStatusChip,
  KoreanFieldworkStatusTone,
} from './korean-fieldwork-record-summary';
import {
  getKoreanFieldworkEvidenceChips,
  KoreanFieldworkEvidenceChip,
} from './korean-fieldwork-record-evidence';
import { isKoreanFieldworkDocumentInScope } from './korean-fieldwork-scope';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';
import {
  getKoreanFieldworkChecklistQuickOptions,
  isKoreanFieldworkChecklistRecord,
} from './korean-fieldwork-quick-record';

const C = KOREAN_FIELDWORK_CATEGORIES;

const UNIT_CATEGORIES: readonly string[] = [
  C.OPERATION,
  C.TRENCH,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
];

const UNIT_CATEGORY_SET = new Set<string>(UNIT_CATEGORIES);

const EVIDENCE_CHIP_IDS = new Set<string>([
  'photos',
  'soilProfilePhotos',
  'drawings',
  'finds',
  'samples',
]);

export interface KoreanFieldworkUnitMatrixItem {
  id: string;
  document: Document;
  title: string;
  categoryLabel: string;
  parentPath?: string;
  childStructureCount: number;
  evidenceCount: number;
  issueCount: number;
  hasCriticalIssue: boolean;
  checklistDone: number;
  checklistTotal: number;
  completionPercent: number;
  tone: KoreanFieldworkStatusTone;
  statusChips: KoreanFieldworkStatusChip[];
  evidenceChips: KoreanFieldworkEvidenceChip[];
  nextChildCategoryName?: string;
  photoCategoryName?: string;
}

export interface KoreanFieldworkFeatureOverviewItem extends KoreanFieldworkUnitMatrixItem {
  statusLabel: string;
  evidenceLabel: string;
  nextActionLabel: string;
}

export const getKoreanFieldworkUnitMatrixItems = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[],
  scopeParent?: Document,
  maxItems = 14,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkUnitMatrixItem[] => {
  const documentsById = new Map(documents.map((document) => [
    document.resource.id,
    document,
  ]));
  const childrenByParentId = getChildrenByParentId(documents, documentsById);
  const issuesByDocumentId = groupIssuesByDocumentId(summary.openIssues);

  return documents
    .filter((document) =>
      UNIT_CATEGORY_SET.has(document.resource.category)
      && isKoreanFieldworkDocumentInScope(document, scopeParent, documentsById)
    )
    .map((document) => buildUnitMatrixItem(
      document,
      documents,
      documentsById,
      childrenByParentId,
      issuesByDocumentId.get(document.resource.id) ?? [],
      investigationModeId
    ))
    .sort((itemA, itemB) => compareUnitMatrixItems(itemA, itemB, scopeParent))
    .slice(0, maxItems);
};

export const getKoreanFieldworkFeatureOverviewItems = (
  summary: KoreanFieldworkTodaySummary,
  documents: Document[],
  scopeParent?: Document,
  maxItems = 80,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkFeatureOverviewItem[] =>
  getKoreanFieldworkUnitMatrixItems(
    summary,
    documents,
    scopeParent,
    Number.MAX_SAFE_INTEGER,
    investigationModeId
  )
    .filter((item) => item.document.resource.category === C.FEATURE)
    .sort(compareFeatureOverviewItems)
    .slice(0, maxItems)
    .map(toFeatureOverviewItem);

const buildUnitMatrixItem = (
  document: Document,
  documents: Document[],
  documentsById: Map<string, Document>,
  childrenByParentId: Map<string, Document[]>,
  issues: KoreanFieldworkReadinessIssue[],
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkUnitMatrixItem => {
  const directChildren = childrenByParentId.get(document.resource.id) ?? [];
  const evidenceChips = getKoreanFieldworkEvidenceChips(document, documents);
  const evidenceCount = getEvidenceCount(evidenceChips);
  const nextChildCategoryName = getNextChildCategoryName(
    document.resource.category,
    investigationModeId
  );
  const childStructureCount = directChildren.filter((child) =>
    UNIT_CATEGORY_SET.has(child.resource.category)
  ).length;
  const checklistSteps = getKoreanFieldworkChecklistQuickOptions(investigationModeId)
    .map((option) => option.value);
  const checklistTotal = isKoreanFieldworkChecklistRecord(
    document.resource.category,
    investigationModeId
  )
    ? checklistSteps.length
    : 0;
  const checklistDone = checklistTotal > 0
    ? getChecklistDoneCount(document, checklistSteps)
    : 0;
  const hasCriticalIssue = issues.some((issue) => issue.severity === 'critical');
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
    document,
    title: document.resource.identifier || document.resource.id,
    categoryLabel: getKoreanFieldworkCategoryLabel(document.resource.category),
    parentPath: formatKoreanFieldworkParentPath(document, documentsById),
    childStructureCount,
    evidenceCount,
    issueCount: issues.length,
    hasCriticalIssue,
    checklistDone,
    checklistTotal,
    completionPercent,
    tone: getTone(hasCriticalIssue, issues.length, completionPercent, evidenceCount),
    statusChips: getKoreanFieldworkRecordStatusChips(document),
    evidenceChips,
    nextChildCategoryName,
    photoCategoryName: evidenceChips.some((chip) => chip.createCategoryName === C.PHOTO)
      ? C.PHOTO
      : undefined,
  };
};

const getCompletionPercent = (
  childStructureCount: number,
  evidenceCount: number,
  issueCount: number,
  checklistDone: number,
  checklistTotal: number,
  needsChildStructure: boolean
): number => {
  const checks: boolean[] = [
    issueCount === 0,
    evidenceCount > 0,
  ];

  if (needsChildStructure) {
    checks.push(childStructureCount > 0);
  }

  if (checklistTotal > 0) {
    checks.push(checklistDone >= checklistTotal);
  }

  const passed = checks.filter(Boolean).length;

  return Math.round((passed / checks.length) * 100);
};

const getTone = (
  hasCriticalIssue: boolean,
  issueCount: number,
  completionPercent: number,
  evidenceCount: number
): KoreanFieldworkStatusTone => {
  if (hasCriticalIssue) return 'danger';
  if (issueCount > 0 || evidenceCount === 0 || completionPercent < 50) return 'warning';
  if (completionPercent < 100) return 'info';
  return 'success';
};

const getEvidenceCount = (
  evidenceChips: KoreanFieldworkEvidenceChip[]
): number => evidenceChips
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

const getNextChildCategoryName = (
  categoryName: string,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): string | undefined => {
  if (categoryName === C.OPERATION) {
    return investigationModeId === 'excavation' ? C.FEATURE : C.TRENCH;
  }

  if (categoryName === C.TRENCH) return C.FEATURE;
  if (categoryName === C.FEATURE) return C.FEATURE_SEGMENT;
  if (categoryName === C.FEATURE_SEGMENT) return C.LAYER;

  return undefined;
};

const toFeatureOverviewItem = (
  item: KoreanFieldworkUnitMatrixItem
): KoreanFieldworkFeatureOverviewItem => ({
  ...item,
  statusLabel: getFeatureOverviewStatusLabel(item),
  evidenceLabel: getFeatureOverviewEvidenceLabel(item),
  nextActionLabel: getFeatureOverviewNextActionLabel(item),
});

const getFeatureOverviewStatusLabel = (
  item: KoreanFieldworkUnitMatrixItem
): string => {
  if (item.hasCriticalIssue) return '필수 보완';
  if (item.issueCount > 0) return '보완 필요';
  if (item.evidenceCount === 0) return '근거자료 없음';
  if (item.checklistTotal > 0 && item.checklistDone < item.checklistTotal) {
    return '조사 중';
  }
  if (item.completionPercent >= 100) return '정리됨';
  return '검토 중';
};

const getFeatureOverviewEvidenceLabel = (
  item: KoreanFieldworkUnitMatrixItem
): string => {
  const visibleEvidence = item.evidenceChips
    .filter((chip) => chip.count > 0)
    .map((chip) => `${chip.label} ${chip.count}`);

  return visibleEvidence.length > 0 ? visibleEvidence.join(' · ') : '없음';
};

const getFeatureOverviewNextActionLabel = (
  item: KoreanFieldworkUnitMatrixItem
): string => {
  if (item.issueCount > 0) return '보완 항목 확인';
  if (item.evidenceCount === 0) return '사진·스케치 연결';
  if (item.checklistTotal > 0 && item.checklistDone < item.checklistTotal) {
    return `조사 과정 ${item.checklistDone}/${item.checklistTotal}`;
  }
  if (item.nextChildCategoryName) {
    return `${getKoreanFieldworkCategoryLabel(item.nextChildCategoryName)} 추가`;
  }
  return '검토 완료';
};

const getChecklistDoneCount = (
  document: Document,
  checklistSteps: string[]
): number =>
  getStringArray((document.resource as unknown as Record<string, unknown>)
    .featureInvestigationChecklist)
    .filter((value) => checklistSteps.includes(value))
    .length;

const getStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];

const compareUnitMatrixItems = (
  itemA: KoreanFieldworkUnitMatrixItem,
  itemB: KoreanFieldworkUnitMatrixItem,
  scopeParent: Document | undefined
): number =>
  Number(itemB.id === scopeParent?.resource.id)
  - Number(itemA.id === scopeParent?.resource.id)
  || getCategoryRank(itemA.document.resource.category)
  - getCategoryRank(itemB.document.resource.category)
  || (itemA.parentPath ?? '').localeCompare(itemB.parentPath ?? '')
  || itemA.title.localeCompare(itemB.title);

const getCategoryRank = (categoryName: string): number => {
  const index = UNIT_CATEGORIES.indexOf(categoryName);
  return index === -1 ? UNIT_CATEGORIES.length : index;
};

const compareFeatureOverviewItems = (
  itemA: KoreanFieldworkUnitMatrixItem,
  itemB: KoreanFieldworkUnitMatrixItem
): number =>
  (itemA.parentPath ?? '').localeCompare(itemB.parentPath ?? '', 'ko')
  || itemA.title.localeCompare(itemB.title, 'ko');
