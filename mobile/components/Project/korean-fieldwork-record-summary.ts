import { Document } from 'idai-field-core';
import {
  getKoreanFieldworkDisplayIdentifier,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import {
  getKoreanFieldworkFeatureTypeLabel,
  getKoreanFieldworkFeatureTypeLabelFromInterpretationType,
} from './korean-fieldwork-feature-types';
import {
  FIELDWORK_QUICK_FIELDS,
  normalizeKoreanFieldworkLongAxisOrientation,
} from './korean-fieldwork-quick-record';

export type KoreanFieldworkStatusTone =
  'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface KoreanFieldworkStatusChip {
  label: string;
  tone: KoreanFieldworkStatusTone;
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const DIRECT_PARENT_RELATIONS = [
  'liesWithin',
  'isRecordedInFeature',
  'depicts',
  'isDepictedIn',
  'isMapLayerOf',
  'isRecordedIn',
];

const FEATURE_RECORDING_STATUS_LABELS: Readonly<Record<string, KoreanFieldworkStatusChip>> = {
  candidate: { label: '조사 전', tone: 'warning' },
  investigating: { label: '조사 중', tone: 'info' },
  confirmed: { label: '완료', tone: 'success' },
};

const RECORD_CREATION_TIMING_LABELS: Readonly<Record<string, KoreanFieldworkStatusChip>> = {
  duringFieldwork: { label: '추가 기록', tone: 'info' },
  sameDayFieldRecord: { label: '당일 기록', tone: 'success' },
  fieldOnlyObservation: { label: '현장 한정', tone: 'warning' },
  handoverStage: { label: '인계 단계', tone: 'info' },
  reportStageGenerated: { label: '보고 단계', tone: 'neutral' },
  postExcavationDerived: { label: '정리 파생', tone: 'neutral' },
};

const VERIFICATION_STATE_LABELS: Readonly<Record<string, KoreanFieldworkStatusChip>> = {
  observedInField: { label: '현장 확인', tone: 'success' },
  candidate: { label: '확인 후보', tone: 'warning' },
  inferred: { label: '추정', tone: 'info' },
  conflictingEvidence: { label: '근거 충돌', tone: 'danger' },
  notObserved: { label: '미확인', tone: 'neutral' },
  needsRecheck: { label: '재검토', tone: 'warning' },
  pendingDecision: { label: '추가 확인', tone: 'warning' },
};

const PROJECT_INVESTIGATION_MODE_LABELS: Readonly<Record<string, string>> = {
  trialTrench: '표본·시굴조사',
  excavation: '발굴조사',
  surfaceSurvey: '지표조사',
  watchingBrief: '참관·입회조사',
};

const GEOMETRY_EDIT_STATUS_LABELS: Readonly<Record<string, KoreanFieldworkStatusChip>> = {
  roughSketch: { label: '약도', tone: 'warning' },
  needsAerialAlignment: { label: '항공 보정', tone: 'warning' },
  alignedToAerialMap: { label: '항공 보정됨', tone: 'success' },
  measured: { label: '실측', tone: 'success' },
};

const QUALITY_TRACKED_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
]);

export const getKoreanFieldworkPrimaryParent = (
  document: Document,
  documentsById: Map<string, Document>
): Document | undefined => {
  const relations = document.resource.relations ?? {};

  for (const relationName of DIRECT_PARENT_RELATIONS) {
    const parent = getFirstExistingDocument(
      relations[relationName],
      documentsById,
      document.resource.id
    );
    if (parent) return parent;
  }

  return undefined;
};

export const getKoreanFieldworkParentPath = (
  document: Document,
  documentsById: Map<string, Document>
): Document[] => {
  const path: Document[] = [];
  const visitedIds = new Set<string>([document.resource.id]);
  let currentDocument = document;

  for (let depth = 0; depth < 8; depth += 1) {
    const parent = getKoreanFieldworkPrimaryParent(
      currentDocument,
      documentsById
    );

    if (!parent || visitedIds.has(parent.resource.id)) break;

    path.unshift(parent);
    visitedIds.add(parent.resource.id);
    currentDocument = parent;
  }

  return path;
};

export const formatKoreanFieldworkParentPath = (
  document: Document,
  documentsById: Map<string, Document>
): string | undefined => {
  const path = getKoreanFieldworkParentPath(document, documentsById);
  if (path.length === 0) return undefined;

  return path
    .map((parent) =>
      getKoreanFieldworkDisplayIdentifier(parent.resource.identifier)
      || parent.resource.id
    )
    .join(' > ');
};

export const getKoreanFieldworkRecordStatusChips = (
  document: Document
): KoreanFieldworkStatusChip[] => {
  const resource = document.resource as any;
  const chips: KoreanFieldworkStatusChip[] = [];
  const featureTypeLabel = getKoreanFieldworkFeatureTypeLabel(resource.featureType)
    ?? getKoreanFieldworkFeatureTypeLabelFromInterpretationType(
      resource.featureInterpretationType
    );
  const axisOrientationChip = getLongAxisOrientationChip(resource);

  pushProjectSetupChips(chips, resource);
  if (featureTypeLabel) chips.push({ label: featureTypeLabel, tone: 'info' });
  if (axisOrientationChip) chips.push(axisOrientationChip);

  pushMappedChip(chips, resource.featureRecordingStatus, FEATURE_RECORDING_STATUS_LABELS);
  pushMappedChip(chips, resource.verificationState, VERIFICATION_STATE_LABELS);
  pushMappedChip(chips, resource.recordCreationTiming, RECORD_CREATION_TIMING_LABELS);
  pushMappedChip(chips, resource.featureGeometryEditStatus, GEOMETRY_EDIT_STATUS_LABELS);

  if (Array.isArray(resource.fieldRecordQuality)) {
    chips.push(resource.fieldRecordQuality.length > 0
      ? { label: `기록 구분 ${resource.fieldRecordQuality.length}`, tone: 'success' }
      : {
        label: '기록 보완',
        tone: QUALITY_TRACKED_CATEGORIES.has(resource.category) ? 'warning' : 'neutral',
      });
  }

  return dedupeChips(chips).slice(0, 4);
};

const pushProjectSetupChips = (
  chips: KoreanFieldworkStatusChip[],
  resource: Record<string, unknown>
) => {
  if (
    resource.category !== C.OPERATION
    && resource.category !== 'Project'
  ) {
    return;
  }

  const modeLabel = typeof resource.projectInvestigationMode === 'string'
    ? PROJECT_INVESTIGATION_MODE_LABELS[resource.projectInvestigationMode]
    : undefined;
  const boundarySummary = getTextResourceValue(resource.projectBoundarySummary);

  if (modeLabel) chips.push({ label: `조사 ${modeLabel}`, tone: 'info' });
  if (boundarySummary) {
    chips.push({
      label: `경계 ${shortenChipText(boundarySummary, 18)}`,
      tone: 'success',
    });
  }
};

const shortenChipText = (value: string, maxLength: number): string =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const getLongAxisOrientationChip = (
  resource: Record<string, unknown>
): KoreanFieldworkStatusChip | undefined => {
  const value = resource[FIELDWORK_QUICK_FIELDS.longAxisOrientation];
  if (typeof value !== 'string') return undefined;

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) return undefined;

  const normalizedValue = normalizeKoreanFieldworkLongAxisOrientation(trimmedValue)
    || trimmedValue.replace(/\s+/g, ' ');
  const referenceValue = getTextResourceValue(
    resource[FIELDWORK_QUICK_FIELDS.orientationReference]
  );
  const label = referenceValue
    ? `장축 ${normalizedValue} · ${referenceValue}`
    : `장축 ${normalizedValue}`;

  return { label, tone: 'info' };
};

const getTextResourceValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  if (Array.isArray(value)) {
    const firstTextValue = value.find((entry) =>
      typeof entry === 'string' && entry.trim().length > 0
    );
    return typeof firstTextValue === 'string'
      ? firstTextValue.trim()
      : undefined;
  }

  return undefined;
};

const getFirstExistingDocument = (
  relationTargets: unknown,
  documentsById: Map<string, Document>,
  currentDocumentId: string
): Document | undefined => {
  if (!Array.isArray(relationTargets)) return undefined;

  const parentId = relationTargets.find((targetId) =>
    typeof targetId === 'string'
    && targetId !== currentDocumentId
    && documentsById.has(targetId)
  );

  return parentId ? documentsById.get(parentId) : undefined;
};

const pushMappedChip = (
  chips: KoreanFieldworkStatusChip[],
  value: unknown,
  labels: Readonly<Record<string, KoreanFieldworkStatusChip>>
) => {
  if (typeof value !== 'string') return;
  const chip = labels[value];
  if (chip) chips.push(chip);
};

const dedupeChips = (
  chips: KoreanFieldworkStatusChip[]
): KoreanFieldworkStatusChip[] => {
  const labels = new Set<string>();

  return chips.filter((chip) => {
    if (labels.has(chip.label)) return false;
    labels.add(chip.label);
    return true;
  });
};
