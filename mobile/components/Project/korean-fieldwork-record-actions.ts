import {
  buildEvidenceBundle,
  Document,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import { getKoreanFieldworkEvidenceChips } from './korean-fieldwork-record-evidence';
import {
  formatKoreanFieldworkParentPath,
  getKoreanFieldworkPrimaryParent,
  KoreanFieldworkStatusTone,
} from './korean-fieldwork-record-summary';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';
import {
  getKoreanFieldworkChecklistQuickOptions,
  isKoreanFieldworkChecklistRecord,
} from './korean-fieldwork-quick-record';

const C = KOREAN_FIELDWORK_CATEGORIES;

const STRUCTURE_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
]);

const TRACKED_RECORD_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
]);

const NEXT_CHILD_CATEGORY: Readonly<Record<string, string | undefined>> = {
  [C.OPERATION]: C.TRENCH,
  [C.TRENCH]: C.FEATURE,
  [C.FEATURE_GROUP]: C.FEATURE,
  [C.FEATURE]: C.FEATURE_SEGMENT,
  [C.FEATURE_SEGMENT]: C.LAYER,
};

const EVIDENCE_CHIP_IDS = new Set<string>([
  'photos',
  'soilProfilePhotos',
  'drawings',
  'finds',
  'samples',
]);

const PREFERRED_EVIDENCE_ACTION_IDS = [
  'photos',
  'soilProfilePhotos',
  'drawings',
  'finds',
  'samples',
];

export type KoreanFieldworkRecordActionType = 'createDocument'|'openDocument';

export interface KoreanFieldworkRecordActionItem {
  id: string;
  type: KoreanFieldworkRecordActionType;
  label: string;
  detail: string;
  icon: string;
  tone: KoreanFieldworkStatusTone;
  categoryName?: string;
  document?: Document;
}

export interface KoreanFieldworkRecordActionSummary {
  isTracked: boolean;
  title: string;
  categoryLabel: string;
  parentPath?: string;
  structureCount: number;
  evidenceCount: number;
  issueCount: number;
  checklistDone: number;
  checklistTotal: number;
  completionPercent: number;
  tone: KoreanFieldworkStatusTone;
  actions: KoreanFieldworkRecordActionItem[];
}

export const getKoreanFieldworkRecordActionSummary = (
  document: Document,
  documents: Document[],
  allowedAddCategoryNames: string[] = [],
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkRecordActionSummary => {
  const documentsById = new Map(documents.map((candidate) => [
    candidate.resource.id,
    candidate,
  ]));
  documentsById.set(document.resource.id, document);

  const allowedAddCategories = new Set(allowedAddCategoryNames);
  const directChildren = getDirectChildren(document, documents, documentsById);
  const evidenceChips = getKoreanFieldworkEvidenceChips(document, documents);
  const evidenceBundle = buildEvidenceBundle(document, documents);
  const issues = sortIssuesForCurrentDocument(document, evidenceBundle.issues);
  const checklistStepValues = getChecklistStepValues(
    document,
    investigationModeId
  );
  const checklistDone = getChecklistDoneCount(document, checklistStepValues);
  const checklistTotal = checklistStepValues.length;
  const evidenceCount = evidenceChips
    .filter((chip) => EVIDENCE_CHIP_IDS.has(chip.id))
    .reduce((count, chip) => count + chip.count, 0);
  const structureCount = directChildren
    .filter((child) => STRUCTURE_CATEGORIES.has(child.resource.category))
    .length;
  const completionPercent = getCompletionPercent(
    document,
    directChildren,
    evidenceCount,
    issues.length,
    checklistDone,
    checklistTotal
  );
  const tone = getTone(issues, evidenceCount, completionPercent);

  return {
    isTracked: TRACKED_RECORD_CATEGORIES.has(document.resource.category),
    title: document.resource.identifier || document.resource.id,
    categoryLabel: getKoreanFieldworkCategoryLabel(document.resource.category),
    parentPath: formatKoreanFieldworkParentPath(document, documentsById),
    structureCount,
    evidenceCount,
    issueCount: issues.length,
    checklistDone,
    checklistTotal,
    completionPercent,
    tone,
    actions: getRecordActions(
      document,
      directChildren,
      evidenceChips,
      issues,
      documentsById,
      allowedAddCategories
    ),
  };
};

const getRecordActions = (
  document: Document,
  directChildren: Document[],
  evidenceChips: ReturnType<typeof getKoreanFieldworkEvidenceChips>,
  issues: KoreanFieldworkReadinessIssue[],
  documentsById: Map<string, Document>,
  allowedAddCategories: Set<string>
): KoreanFieldworkRecordActionItem[] => {
  const actions: KoreanFieldworkRecordActionItem[] = [];
  const issueAction = getIssueAction(document, issues, documentsById);
  if (issueAction) actions.push(issueAction);

  const structureAction = getStructureAction(
    document,
    directChildren,
    allowedAddCategories
  );
  if (structureAction) actions.push(structureAction);

  const missingEvidenceAction = getMissingEvidenceAction(
    document,
    evidenceChips,
    allowedAddCategories
  );
  if (missingEvidenceAction) actions.push(missingEvidenceAction);

  const openEvidenceAction = getOpenEvidenceAction(evidenceChips);
  if (openEvidenceAction) actions.push(openEvidenceAction);

  return dedupeActions(actions).slice(0, 4);
};

const getIssueAction = (
  document: Document,
  issues: KoreanFieldworkReadinessIssue[],
  documentsById: Map<string, Document>
): KoreanFieldworkRecordActionItem | undefined => {
  const [issue] = issues;
  if (!issue) return undefined;

  const issueDocument = documentsById.get(issue.documentId) ?? document;

  return {
    id: `issue-${issue.ruleId}-${issue.documentId}`,
    type: 'openDocument',
    label: issueDocument.resource.id === document.resource.id
      ? '이 기록 점검'
      : '관련 점검 열기',
    detail: issue.recommendedAction,
    icon: issue.severity === 'critical' ? 'error-outline' : 'priority-high',
    tone: issue.severity === 'critical' ? 'danger' : 'warning',
    document: issueDocument,
  };
};

const getStructureAction = (
  document: Document,
  directChildren: Document[],
  allowedAddCategories: Set<string>
): KoreanFieldworkRecordActionItem | undefined => {
  const nextCategoryName = NEXT_CHILD_CATEGORY[document.resource.category];
  if (!nextCategoryName || !allowedAddCategories.has(nextCategoryName)) return undefined;

  const hasExpectedChild = directChildren.some((child) =>
    child.resource.category === nextCategoryName
  );
  if (hasExpectedChild) return undefined;

  const childLabel = getKoreanFieldworkCategoryLabel(nextCategoryName);

  return {
    id: `create-${nextCategoryName}`,
    type: 'createDocument',
    label: `${childLabel} 추가`,
    detail: `${getKoreanFieldworkCategoryLabel(document.resource.category)} 아래에 ${childLabel} 기록을 이어 만듭니다.`,
    icon: getCreateIcon(nextCategoryName),
    tone: document.resource.category === C.OPERATION ? 'warning' : 'info',
    categoryName: nextCategoryName,
  };
};

const getMissingEvidenceAction = (
  document: Document,
  evidenceChips: ReturnType<typeof getKoreanFieldworkEvidenceChips>,
  allowedAddCategories: Set<string>
): KoreanFieldworkRecordActionItem | undefined => {
  const missingChip = PREFERRED_EVIDENCE_ACTION_IDS
    .map((chipId) => evidenceChips.find((chip) => chip.id === chipId))
    .find((chip) =>
      chip
      && chip.count === 0
      && !!chip.createCategoryName
      && allowedAddCategories.has(chip.createCategoryName)
    );

  if (!missingChip?.createCategoryName) return undefined;

  return {
    id: `create-${missingChip.id}`,
    type: 'createDocument',
    label: `${missingChip.label} 추가`,
    detail: `${getKoreanFieldworkCategoryLabel(document.resource.category)} 기록에 ${missingChip.label} 근거를 연결합니다.`,
    icon: getCreateIcon(missingChip.createCategoryName),
    tone: 'warning',
    categoryName: missingChip.createCategoryName,
  };
};

const getOpenEvidenceAction = (
  evidenceChips: ReturnType<typeof getKoreanFieldworkEvidenceChips>
): KoreanFieldworkRecordActionItem | undefined => {
  const filledChip = PREFERRED_EVIDENCE_ACTION_IDS
    .map((chipId) => evidenceChips.find((chip) => chip.id === chipId))
    .find((chip) => chip && chip.documents.length > 0);
  const [document] = filledChip?.documents ?? [];
  if (!filledChip || !document) return undefined;

  return {
    id: `open-${filledChip.id}`,
    type: 'openDocument',
    label: `${filledChip.label} 열기`,
    detail: `${filledChip.documents.length}건의 ${filledChip.label} 근거가 연결되어 있습니다.`,
    icon: getCreateIcon(document.resource.category),
    tone: 'success',
    document,
  };
};

const getCompletionPercent = (
  document: Document,
  directChildren: Document[],
  evidenceCount: number,
  issueCount: number,
  checklistDone: number,
  checklistTotal: number
): number => {
  const resource = document.resource as unknown as Record<string, unknown>;
  const checks: boolean[] = [
    issueCount === 0,
    hasTextValue(resource.recordCreationTiming),
  ];
  const nextChildCategory = NEXT_CHILD_CATEGORY[document.resource.category];

  if (nextChildCategory) {
    checks.push(directChildren.some((child) =>
      child.resource.category === nextChildCategory
    ));
  }

  if (TRACKED_RECORD_CATEGORIES.has(document.resource.category)) {
    checks.push(evidenceCount > 0);
  }

  if (Array.isArray(resource.fieldRecordQuality)) {
    checks.push(resource.fieldRecordQuality.length > 0);
  }

  if (checklistTotal > 0) {
    checks.push(checklistDone >= checklistTotal);
  }

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getTone = (
  issues: KoreanFieldworkReadinessIssue[],
  evidenceCount: number,
  completionPercent: number
): KoreanFieldworkStatusTone => {
  if (issues.some((issue) => issue.severity === 'critical')) return 'danger';
  if (issues.length > 0 || evidenceCount === 0 || completionPercent < 50) return 'warning';
  if (completionPercent < 100) return 'info';
  return 'success';
};

const getDirectChildren = (
  document: Document,
  documents: Document[],
  documentsById: Map<string, Document>
): Document[] => documents.filter((candidate) =>
  candidate.resource.id !== document.resource.id
  && getKoreanFieldworkPrimaryParent(candidate, documentsById)?.resource.id
    === document.resource.id
);

const sortIssuesForCurrentDocument = (
  document: Document,
  issues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkReadinessIssue[] => [...issues].sort((issueA, issueB) =>
  Number(issueB.documentId === document.resource.id)
  - Number(issueA.documentId === document.resource.id)
  || getSeverityRank(issueB) - getSeverityRank(issueA)
);

const getSeverityRank = (issue: KoreanFieldworkReadinessIssue): number => {
  switch (issue.severity) {
    case 'critical':
      return 3;
    case 'warning':
      return 2;
    default:
      return 1;
  }
};

const getChecklistStepValues = (
  document: Document,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): string[] =>
  isKoreanFieldworkChecklistRecord(
    document.resource.category,
    investigationModeId
  )
    ? getKoreanFieldworkChecklistQuickOptions(investigationModeId)
      .map((option) => option.value)
    : [];

const getChecklistDoneCount = (
  document: Document,
  checklistStepValues: string[]
): number =>
  getStringArray(
    (document.resource as unknown as Record<string, unknown>)
      .featureInvestigationChecklist
  )
    .filter((value) => checklistStepValues.includes(value))
    .length;

const getStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];

const hasTextValue = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const dedupeActions = (
  actions: KoreanFieldworkRecordActionItem[]
): KoreanFieldworkRecordActionItem[] => {
  const ids = new Set<string>();

  return actions.filter((action) => {
    if (ids.has(action.id)) return false;
    ids.add(action.id);
    return true;
  });
};

const getCreateIcon = (categoryName: string): string => {
  switch (categoryName) {
    case C.TRENCH:
      return 'crop-square';
    case C.FEATURE:
      return 'add-location-alt';
    case C.FEATURE_SEGMENT:
      return 'account-tree';
    case C.LAYER:
      return 'layers';
    case C.PHOTO:
      return 'photo-camera';
    case C.SOIL_PROFILE_PHOTO:
      return 'terrain';
    case C.DRAWING:
      return 'architecture';
    case C.FIND:
      return 'inventory-2';
    case C.SAMPLE:
      return 'science';
    default:
      return 'add-circle-outline';
  }
};
