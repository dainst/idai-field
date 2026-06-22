import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import {
  FEATURE_WORKFLOW_CATEGORIES,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';

export interface KoreanFieldworkQuickOption {
  value: string;
  label: string;
}

export interface KoreanFieldworkQuickPreset {
  id: KoreanFieldworkQuickPresetId;
  label: string;
  detail: string;
  icon: string;
}

export type KoreanFieldworkQuickPresetId =
  'startFeatureInvestigation'
  | 'closeFeatureInvestigation';

export const FIELDWORK_QUICK_FIELDS = {
  checklist: 'featureInvestigationChecklist',
  featureStatus: 'featureRecordingStatus',
  quality: 'fieldRecordQuality',
  verification: 'verificationState',
  timing: 'recordCreationTiming',
} as const;

export const FEATURE_STATUS_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'candidate', label: '후보' },
  { value: 'investigating', label: '조사중' },
  { value: 'confirmed', label: '확정' },
  { value: 'rejected', label: '제외' },
];

export const FEATURE_CHECKLIST_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'preInvestigationPhotoTaken', label: '조사 전 사진' },
  { value: 'inProgressPhotoTaken', label: '조사 중 사진' },
  { value: 'soilProfilePhotoLinked', label: '토층사진' },
  { value: 'measuredDrawingCompleted', label: '실측' },
  { value: 'preRecoveryFindPhotoTaken', label: '수습 전 사진' },
  { value: 'findsRecovered', label: '유물 수습' },
  { value: 'findRecordsLinked', label: '유물 기록 연결' },
  { value: 'samplesCollected', label: '시료' },
  { value: 'penMemoReviewed', label: '펜메모 검토' },
  { value: 'completionPhotoTaken', label: '완료 사진' },
];

export const QUALITY_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'immediateRecording', label: '즉기 기록' },
  { value: 'factualAccuracy', label: '사실 왜곡 없음' },
  { value: 'observationInterpretationSeparated', label: '관찰·해석 구분' },
  { value: 'reproducibleRecord', label: '재현 가능' },
  { value: 'fieldToReportContinuity', label: '보고서 연속성' },
  { value: 'correctionNeeded', label: '보완 필요' },
];

export const VERIFICATION_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'observedInField', label: '현장 관찰' },
  { value: 'candidate', label: '후보' },
  { value: 'needsRecheck', label: '재검토' },
  { value: 'pendingDecision', label: '판단 보류' },
];

export const TIMING_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'duringFieldwork', label: '현장 중 누적' },
  { value: 'sameDayFieldRecord', label: '당일 기록' },
  { value: 'fieldOnlyObservation', label: '현장 한정' },
  { value: 'handoverStage', label: '인계 단계' },
];

export const FEATURE_WORKFLOW_QUICK_PRESETS: readonly KoreanFieldworkQuickPreset[] = [
  {
    id: 'startFeatureInvestigation',
    label: '조사 시작',
    detail: '조사중 전환, 조사 전·중 사진, 즉기 기록',
    icon: 'play-circle-outline',
  },
  {
    id: 'closeFeatureInvestigation',
    label: '마감 기본',
    detail: '확정 전환, 완료 사진, 실측, 기록 품질',
    icon: 'task-alt',
  },
];

const C = KOREAN_FIELDWORK_CATEGORIES;

const FEATURE_CATEGORIES = new Set<string>(FEATURE_WORKFLOW_CATEGORIES);

const FIELDWORK_RECORD_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
  C.SURVEY_BOUNDARY,
  C.FIND,
  C.FIND_COLLECTION,
  C.SAMPLE,
  C.PHOTO,
  C.SOIL_PROFILE_PHOTO,
  C.DRAWING,
  C.PEN_MEMO,
]);

export interface KoreanFieldworkQuickRecordAvailability {
  checklist: boolean;
  featureStatus: boolean;
  quality: boolean;
  verification: boolean;
  timing: boolean;
}

export const getKoreanFieldworkQuickRecordAvailability = (
  category: CategoryForm | undefined,
  resource: NewResource
): KoreanFieldworkQuickRecordAvailability => {
  const fieldNames = getCategoryFieldNames(category);

  return {
    checklist: FEATURE_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.checklist),
    featureStatus: FEATURE_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.featureStatus),
    quality: FIELDWORK_RECORD_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.quality),
    verification: FIELDWORK_RECORD_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.verification),
    timing: FIELDWORK_RECORD_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.timing),
  };
};

export const hasKoreanFieldworkQuickRecordActions = (
  availability: KoreanFieldworkQuickRecordAvailability
): boolean =>
  availability.checklist
  || availability.featureStatus
  || availability.quality
  || availability.verification
  || availability.timing;

export const getKoreanFieldworkQuickPresets = (
  availability: KoreanFieldworkQuickRecordAvailability
): readonly KoreanFieldworkQuickPreset[] =>
  availability.checklist || availability.featureStatus
    ? FEATURE_WORKFLOW_QUICK_PRESETS
    : [];

export const getKoreanFieldworkQuickPresetUpdates = (
  resource: NewResource,
  availability: KoreanFieldworkQuickRecordAvailability,
  presetId: KoreanFieldworkQuickPresetId
): Record<string, unknown> => {
  switch (presetId) {
    case 'startFeatureInvestigation':
      return getStartFeatureInvestigationUpdates(resource, availability);
    case 'closeFeatureInvestigation':
      return getCloseFeatureInvestigationUpdates(resource, availability);
    default:
      return {};
  }
};

export const getStringArrayFieldValues = (
  resource: NewResource,
  fieldName: string
): string[] => {
  const fieldValue = getResourceFieldValue(resource, fieldName);

  return Array.isArray(fieldValue)
    ? fieldValue.filter((value): value is string => typeof value === 'string')
    : [];
};

export const toggleStringArrayFieldValue = (
  resource: NewResource,
  fieldName: string,
  value: string
): string[] => {
  const values = getStringArrayFieldValues(resource, fieldName);

  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
};

const getStartFeatureInvestigationUpdates = (
  resource: NewResource,
  availability: KoreanFieldworkQuickRecordAvailability
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};

  if (availability.featureStatus) {
    updates[FIELDWORK_QUICK_FIELDS.featureStatus] = 'investigating';
  }

  if (availability.checklist) {
    updates[FIELDWORK_QUICK_FIELDS.checklist] = mergeStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.checklist,
      ['preInvestigationPhotoTaken', 'inProgressPhotoTaken']
    );
  }

  if (availability.quality) {
    updates[FIELDWORK_QUICK_FIELDS.quality] = mergeStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.quality,
      ['immediateRecording']
    );
  }

  if (availability.timing && !hasTextValue(
    getResourceFieldValue(resource, FIELDWORK_QUICK_FIELDS.timing)
  )) {
    updates[FIELDWORK_QUICK_FIELDS.timing] = 'duringFieldwork';
  }

  if (availability.verification && canUseObservedInField(resource)) {
    updates[FIELDWORK_QUICK_FIELDS.verification] = 'observedInField';
  }

  return updates;
};

const getCloseFeatureInvestigationUpdates = (
  resource: NewResource,
  availability: KoreanFieldworkQuickRecordAvailability
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};

  if (availability.featureStatus) {
    updates[FIELDWORK_QUICK_FIELDS.featureStatus] = 'confirmed';
  }

  if (availability.checklist) {
    updates[FIELDWORK_QUICK_FIELDS.checklist] = mergeStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.checklist,
      ['completionPhotoTaken', 'measuredDrawingCompleted']
    );
  }

  if (availability.quality) {
    updates[FIELDWORK_QUICK_FIELDS.quality] = mergeStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.quality,
      [
        'factualAccuracy',
        'observationInterpretationSeparated',
        'fieldToReportContinuity',
      ]
    );
  }

  if (availability.timing && !hasTextValue(
    getResourceFieldValue(resource, FIELDWORK_QUICK_FIELDS.timing)
  )) {
    updates[FIELDWORK_QUICK_FIELDS.timing] = 'sameDayFieldRecord';
  }

  if (availability.verification && canUseObservedInField(resource)) {
    updates[FIELDWORK_QUICK_FIELDS.verification] = 'observedInField';
  }

  return updates;
};

const mergeStringArrayFieldValues = (
  resource: NewResource,
  fieldName: string,
  values: string[]
): string[] => {
  const mergedValues = [...getStringArrayFieldValues(resource, fieldName)];

  values.forEach((value) => {
    if (!mergedValues.includes(value)) mergedValues.push(value);
  });

  return mergedValues;
};

const canUseObservedInField = (resource: NewResource): boolean => {
  const verificationState = getResourceFieldValue(
    resource,
    FIELDWORK_QUICK_FIELDS.verification
  );

  return !hasTextValue(verificationState)
    || verificationState === 'candidate'
    || verificationState === 'pendingDecision';
};

const getCategoryFieldNames = (category: CategoryForm | undefined): Set<string> => {
  if (!category) return new Set();

  return new Set(category.groups.flatMap((group) =>
    group.fields.map((field) => field.name)
  ));
};

export const getResourceFieldValue = (
  resource: NewResource,
  fieldName: string
): unknown => (
  resource as unknown as Record<string, unknown>
)[fieldName];

const hasTextValue = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;
