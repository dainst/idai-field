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

export const FIELDWORK_QUICK_FIELDS = {
  checklist: 'featureInvestigationChecklist',
  quality: 'fieldRecordQuality',
  verification: 'verificationState',
  timing: 'recordCreationTiming',
} as const;

export const FEATURE_CHECKLIST_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'preInvestigationPhotoTaken', label: '조사 전 사진' },
  { value: 'inProgressPhotoTaken', label: '조사 중 사진' },
  { value: 'soilProfilePhotoLinked', label: '토층사진' },
  { value: 'measuredDrawingCompleted', label: '실측' },
  { value: 'preRecoveryFindPhotoTaken', label: '수습 전 사진' },
  { value: 'findsRecovered', label: '유물 수습' },
  { value: 'samplesCollected', label: '시료' },
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
  || availability.quality
  || availability.verification
  || availability.timing;

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
