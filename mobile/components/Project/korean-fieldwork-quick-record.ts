import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import {
  FEATURE_WORKFLOW_CATEGORIES,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';

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
  { value: 'candidate', label: '조사 전' },
  { value: 'investigating', label: '조사 중' },
  { value: 'confirmed', label: '완료' },
];

export const FEATURE_CHECKLIST_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'preInvestigationPhotoTaken', label: '조사 전 사진' },
  { value: 'inProgressPhotoTaken', label: '조사 중 사진' },
  { value: 'soilProfilePhotoLinked', label: '토층사진' },
  { value: 'measuredDrawingCompleted', label: '실측' },
  { value: 'preRecoveryFindPhotoTaken', label: '수습 전 사진' },
  { value: 'findsRecovered', label: '유물 수습' },
  { value: 'samplesCollected', label: '시료' },
  { value: 'penMemoReviewed', label: '펜메모 검토' },
  { value: 'completionPhotoTaken', label: '완료 사진' },
];

const TRIAL_TRENCH_CHECKLIST_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'trenchSoilCleaned', label: '토층 정리' },
  { value: 'trenchFeatureChecked', label: '유구 확인' },
  { value: 'trenchPitOpened', label: '피트 조사' },
  { value: 'trenchPitProfileDrawn', label: '피트 토층도' },
  { value: 'trenchOverviewPhotoTaken', label: '정방향 사진' },
  { value: 'trenchObliquePhotoTaken', label: '사선 사진' },
  { value: 'soilProfilePhotoLinked', label: '기준 토층사진' },
  { value: 'inProgressPhotoTaken', label: '유구 사진' },
  { value: 'penMemoReviewed', label: '펜메모 검토' },
];

const EXCAVATION_CHECKLIST_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'preInvestigationPhotoTaken', label: '조사 전 사진' },
  { value: 'inProgressPhotoTaken', label: '조사 중 사진' },
  { value: 'soilProfilePhotoLinked', label: '토층사진' },
  { value: 'preRecoveryFindPhotoTaken', label: '수습 전 사진' },
  { value: 'findsRecovered', label: '유물 수습' },
  { value: 'samplesCollected', label: '시료' },
  { value: 'completionPhotoTaken', label: '완료 사진' },
  { value: 'measuredDrawingCompleted', label: '실측' },
  { value: 'penMemoReviewed', label: '펜메모 검토' },
];

export const QUALITY_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'immediateRecording', label: '현장 기록' },
  { value: 'observationInterpretationSeparated', label: '해석' },
  { value: 'correctionNeeded', label: '보완 메모' },
];

export const TIMING_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'sameDayFieldRecord', label: '당일 기록' },
  { value: 'duringFieldwork', label: '추가 기록' },
];

export const FEATURE_WORKFLOW_QUICK_PRESETS: readonly KoreanFieldworkQuickPreset[] = [
  {
    id: 'startFeatureInvestigation',
    label: '조사 시작',
    detail: '조사 중 전환, 조사 전·중 사진, 현장 기록',
    icon: 'play-circle-outline',
  },
  {
    id: 'closeFeatureInvestigation',
    label: '조사 완료',
    detail: '완료 전환, 완료 사진, 실측, 해석 메모',
    icon: 'task-alt',
  },
];

const TRIAL_TRENCH_WORKFLOW_QUICK_PRESETS: readonly KoreanFieldworkQuickPreset[] = [
  {
    id: 'startFeatureInvestigation',
    label: '트렌치 조사 시작',
    detail: '토층 정리, 유구 확인, 현장 기록',
    icon: 'play-circle-outline',
  },
  {
    id: 'closeFeatureInvestigation',
    label: '트렌치 마감',
    detail: '피트, 토층도, 사진 기록',
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
  resource: NewResource,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): KoreanFieldworkQuickRecordAvailability => {
  const fieldNames = getCategoryFieldNames(category);

  return {
    checklist: isKoreanFieldworkChecklistRecord(
      resource.category,
      investigationModeId
    )
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.checklist),
    featureStatus: FEATURE_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.featureStatus),
    quality: FIELDWORK_RECORD_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.quality),
    verification: false,
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
  || availability.timing;

export const getKoreanFieldworkQuickPresets = (
  availability: KoreanFieldworkQuickRecordAvailability,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): readonly KoreanFieldworkQuickPreset[] =>
  availability.checklist || availability.featureStatus
    ? investigationModeId === 'trialTrench'
      ? TRIAL_TRENCH_WORKFLOW_QUICK_PRESETS
      : FEATURE_WORKFLOW_QUICK_PRESETS
    : [];

export const getKoreanFieldworkChecklistQuickOptions = (
  investigationModeId?: KoreanFieldworkInvestigationModeId
): readonly KoreanFieldworkQuickOption[] => {
  switch (investigationModeId) {
    case 'trialTrench':
      return TRIAL_TRENCH_CHECKLIST_QUICK_OPTIONS;
    case 'excavation':
      return EXCAVATION_CHECKLIST_QUICK_OPTIONS;
    default:
      return FEATURE_CHECKLIST_QUICK_OPTIONS;
  }
};

export const isKoreanFieldworkChecklistRecord = (
  categoryName: string,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): boolean =>
  FEATURE_CATEGORIES.has(categoryName)
  || (
    categoryName === C.TRENCH
    && investigationModeId === 'trialTrench'
  );

export const getKoreanFieldworkQuickPresetUpdates = (
  resource: NewResource,
  availability: KoreanFieldworkQuickRecordAvailability,
  presetId: KoreanFieldworkQuickPresetId,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): Record<string, unknown> => {
  switch (presetId) {
    case 'startFeatureInvestigation':
      return getStartFeatureInvestigationUpdates(
        resource,
        availability,
        investigationModeId
      );
    case 'closeFeatureInvestigation':
      return getCloseFeatureInvestigationUpdates(
        resource,
        availability,
        investigationModeId
      );
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
  availability: KoreanFieldworkQuickRecordAvailability,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};

  if (availability.featureStatus) {
    updates[FIELDWORK_QUICK_FIELDS.featureStatus] = 'investigating';
  }

  if (availability.checklist) {
    updates[FIELDWORK_QUICK_FIELDS.checklist] = mergeStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.checklist,
      getStartChecklistValues(investigationModeId)
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

  return updates;
};

const getCloseFeatureInvestigationUpdates = (
  resource: NewResource,
  availability: KoreanFieldworkQuickRecordAvailability,
  investigationModeId?: KoreanFieldworkInvestigationModeId
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};

  if (availability.featureStatus) {
    updates[FIELDWORK_QUICK_FIELDS.featureStatus] = 'confirmed';
  }

  if (availability.checklist) {
    updates[FIELDWORK_QUICK_FIELDS.checklist] = mergeStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.checklist,
      getCloseChecklistValues(investigationModeId)
    );
  }

  if (availability.quality) {
    updates[FIELDWORK_QUICK_FIELDS.quality] = mergeStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.quality,
      ['immediateRecording', 'observationInterpretationSeparated']
    );
  }

  if (availability.timing && !hasTextValue(
    getResourceFieldValue(resource, FIELDWORK_QUICK_FIELDS.timing)
  )) {
    updates[FIELDWORK_QUICK_FIELDS.timing] = 'sameDayFieldRecord';
  }

  return updates;
};

const getStartChecklistValues = (
  investigationModeId?: KoreanFieldworkInvestigationModeId
): string[] => {
  switch (investigationModeId) {
    case 'trialTrench':
      return [
        'trenchSoilCleaned',
        'trenchFeatureChecked',
      ];
    default:
      return [
        'preInvestigationPhotoTaken',
        'inProgressPhotoTaken',
      ];
  }
};

const getCloseChecklistValues = (
  investigationModeId?: KoreanFieldworkInvestigationModeId
): string[] => {
  switch (investigationModeId) {
    case 'trialTrench':
      return [
        'trenchPitOpened',
        'trenchPitProfileDrawn',
        'trenchOverviewPhotoTaken',
        'trenchObliquePhotoTaken',
        'soilProfilePhotoLinked',
        'inProgressPhotoTaken',
      ];
    default:
      return [
        'completionPhotoTaken',
        'measuredDrawingCompleted',
      ];
  }
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
