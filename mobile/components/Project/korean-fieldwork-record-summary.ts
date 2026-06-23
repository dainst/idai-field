import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

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
  candidate: { label: '유구 후보', tone: 'warning' },
  investigating: { label: '조사중', tone: 'info' },
  confirmed: { label: '확정', tone: 'success' },
  rejected: { label: '제외', tone: 'neutral' },
  merged: { label: '병합', tone: 'info' },
};

const RECORD_CREATION_TIMING_LABELS: Readonly<Record<string, KoreanFieldworkStatusChip>> = {
  duringFieldwork: { label: '현장 작성', tone: 'success' },
  fieldOnlyObservation: { label: '현장 한정', tone: 'warning' },
  handoverStage: { label: '인계 단계', tone: 'info' },
  reportStageGenerated: { label: '보고 단계', tone: 'neutral' },
  postExcavationDerived: { label: '정리 파생', tone: 'neutral' },
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
    .map((parent) => parent.resource.identifier || parent.resource.id)
    .join(' > ');
};

export const getKoreanFieldworkRecordStatusChips = (
  document: Document
): KoreanFieldworkStatusChip[] => {
  const resource = document.resource as any;
  const chips: KoreanFieldworkStatusChip[] = [];

  pushMappedChip(chips, resource.featureRecordingStatus, FEATURE_RECORDING_STATUS_LABELS);
  pushMappedChip(chips, resource.recordCreationTiming, RECORD_CREATION_TIMING_LABELS);
  pushMappedChip(chips, resource.featureGeometryEditStatus, GEOMETRY_EDIT_STATUS_LABELS);

  if (Array.isArray(resource.fieldRecordQuality)) {
    chips.push(resource.fieldRecordQuality.length > 0
      ? { label: `기록 확인 ${resource.fieldRecordQuality.length}`, tone: 'success' }
      : {
        label: '기록 보완',
        tone: QUALITY_TRACKED_CATEGORIES.has(resource.category) ? 'warning' : 'neutral',
      });
  }

  return dedupeChips(chips).slice(0, 4);
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
