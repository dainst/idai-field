import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import {
  FEATURE_WORKFLOW_CATEGORIES,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import {
  getKoreanFieldworkFeatureInterpretationTypeValue,
  KOREAN_FIELDWORK_FEATURE_TYPE_INTERPRETATION_VALUES,
  KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS,
} from './korean-fieldwork-feature-types';
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
  featureInterpretationType: 'featureInterpretationType',
  featureStatus: 'featureRecordingStatus',
  featureType: 'featureType',
  longAxisOrientation: 'longAxisOrientation',
  orientationNote: 'orientationNote',
  orientationReference: 'orientationReference',
  period: 'period',
  quality: 'fieldRecordQuality',
  verification: 'verificationState',
  timing: 'recordCreationTiming',
} as const;

export const LONG_AXIS_ORIENTATION_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'N-E', label: 'N-E' },
  { value: 'N-W', label: 'N-W' },
  { value: 'S-E', label: 'S-E' },
  { value: 'S-W', label: 'S-W' },
];

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

export const VERIFICATION_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'observedInField', label: '현장 확인' },
  { value: 'pendingDecision', label: '추가 확인' },
  { value: 'needsRecheck', label: '재검토' },
  { value: 'notObserved', label: '미확인' },
];

export const FEATURE_TYPE_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] =
  KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

export const FEATURE_PERIOD_QUICK_OPTIONS: readonly KoreanFieldworkQuickOption[] = [
  { value: 'undated', label: '시기미상' },
  { value: 'paleolithic', label: '구석기' },
  { value: 'neolithic', label: '신석기' },
  { value: 'bronzeAge', label: '청동기' },
  { value: 'earlyIronAge', label: '초기철기' },
  { value: 'protoThreeKingdoms', label: '원삼국' },
  { value: 'threeKingdoms', label: '삼국' },
  { value: 'unifiedSilla', label: '통일신라' },
  { value: 'goryeo', label: '고려' },
  { value: 'joseon', label: '조선' },
  { value: 'modernContemporary', label: '근현대' },
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

const AXIS_ORIENTATION_CATEGORIES = new Set<string>([
  C.TRENCH,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
]);

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
  featureType: boolean;
  featureStatus: boolean;
  axisOrientation: boolean;
  period: boolean;
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
    featureType: resource.category === C.FEATURE
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.featureInterpretationType),
    featureStatus: FEATURE_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.featureStatus),
    axisOrientation: AXIS_ORIENTATION_CATEGORIES.has(resource.category)
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.longAxisOrientation),
    period: resource.category === C.FEATURE
      && fieldNames.has(FIELDWORK_QUICK_FIELDS.period),
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
  || availability.featureType
  || availability.featureStatus
  || availability.axisOrientation
  || availability.period
  || availability.quality
  || availability.verification
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

export const getKoreanFieldworkFeatureTypeUpdates = (
  resource: NewResource,
  value: string
): Record<string, unknown> => {
  const featureInterpretationTypeValue =
    getKoreanFieldworkFeatureInterpretationTypeValue(value);
  const currentValues = getStringArrayFieldValues(
    resource,
    FIELDWORK_QUICK_FIELDS.featureInterpretationType
  ).filter((candidate) =>
    !KOREAN_FIELDWORK_FEATURE_TYPE_INTERPRETATION_VALUES.includes(candidate)
  );

  return {
    [FIELDWORK_QUICK_FIELDS.featureType]: value,
    [FIELDWORK_QUICK_FIELDS.featureInterpretationType]:
      featureInterpretationTypeValue
        ? [...currentValues, featureInterpretationTypeValue]
        : currentValues,
  };
};

export const normalizeKoreanFieldworkLongAxisOrientation = (value: string): string => {
  const parsedValue = parseLongAxisOrientation(value);

  if (!parsedValue) return value.trim();

  return parsedValue.degrees === undefined
    ? `${parsedValue.start}-${parsedValue.end}`
    : `${parsedValue.start}-${parsedValue.degrees}°-${parsedValue.end}`;
};

export const isKoreanFieldworkLongAxisOrientation = (value: string): boolean =>
  parseLongAxisOrientation(value) !== undefined;

export const describeKoreanFieldworkLongAxisOrientation = (
  value: string
): string | undefined => {
  const parsedValue = parseLongAxisOrientation(value);
  if (!parsedValue) return undefined;

  return [
    parsedValue.degrees === undefined
      ? `${parsedValue.start}-${parsedValue.end}`
      : `${parsedValue.start}-${parsedValue.degrees}°-${parsedValue.end}`,
    ' = ',
    `${KOREAN_CARDINAL_DIRECTION_LABELS[parsedValue.start]}에서 `,
    `${KOREAN_CARDINAL_DIRECTION_LABELS[parsedValue.end]}쪽으로 `,
    parsedValue.degrees === undefined
      ? '기운 장축'
      : `${parsedValue.degrees}°`,
  ].join('');
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

const DIRECTION_TOKEN_PATTERN = '(?:[NSEW]|북쪽?|남쪽?|동쪽?|서쪽?)';
const DIAGONAL_DIRECTION_TOKEN_PATTERN =
  '(?:NE|NW|SE|SW|북동쪽?|동북쪽?|북서쪽?|서북쪽?|남동쪽?|동남쪽?|남서쪽?|서남쪽?)';
const DEGREE_TOKEN_PATTERN = '(?:°|˚|º|도|DEG|DEGREES?)';
const LONG_AXIS_ORIENTATION_PATTERN = new RegExp(
  [
    `^(${DIRECTION_TOKEN_PATTERN})[-\\s]*(\\d{1,3})`,
    `(?:\\s*${DEGREE_TOKEN_PATTERN})?`,
    `[-\\s]*(${DIRECTION_TOKEN_PATTERN})$`,
  ].join(''),
  'i'
);
const LONG_AXIS_ORIENTATION_QUADRANT_PATTERN = new RegExp(
  `^(${DIRECTION_TOKEN_PATTERN})[-\\s]+(${DIRECTION_TOKEN_PATTERN})$`,
  'i'
);
const DIAGONAL_LONG_AXIS_ORIENTATION_PATTERN = new RegExp(
  [
    `^(${DIAGONAL_DIRECTION_TOKEN_PATTERN})[-\\s]*(\\d{1,3})`,
    `(?:\\s*${DEGREE_TOKEN_PATTERN})?$`,
  ].join(''),
  'i'
);
const DIAGONAL_LONG_AXIS_ORIENTATION_QUADRANT_PATTERN = new RegExp(
  `^(${DIAGONAL_DIRECTION_TOKEN_PATTERN})$`,
  'i'
);
const KOREAN_LONG_AXIS_ORIENTATION_PHRASE_PATTERN = new RegExp(
  [
    `^(${DIRECTION_TOKEN_PATTERN})에서\\s*`,
    `(${DIRECTION_TOKEN_PATTERN})으로\\s*(\\d{1,3})`,
    `(?:\\s*${DEGREE_TOKEN_PATTERN})?$`,
  ].join(''),
  'i'
);
const KOREAN_LONG_AXIS_ORIENTATION_QUADRANT_PHRASE_PATTERN = new RegExp(
  [
    `^(${DIRECTION_TOKEN_PATTERN})에서\\s*`,
    `(${DIRECTION_TOKEN_PATTERN})으로$`,
  ].join(''),
  'i'
);

const OPPOSITE_DIRECTION: Record<string, string> = {
  E: 'W',
  N: 'S',
  S: 'N',
  W: 'E',
};

const KOREAN_CARDINAL_DIRECTION_LABELS: Record<string, string> = {
  E: '동',
  N: '북',
  S: '남',
  W: '서',
};

const KOREAN_DIRECTION_TOKEN_MAP: Record<string, string> = {
  동: 'E',
  동쪽: 'E',
  남: 'S',
  남쪽: 'S',
  북: 'N',
  북쪽: 'N',
  서: 'W',
  서쪽: 'W',
};

const DIAGONAL_DIRECTION_TOKEN_MAP: Record<string, { start: string; end: string }> = {
  NE: { start: 'N', end: 'E' },
  NW: { start: 'N', end: 'W' },
  SE: { start: 'S', end: 'E' },
  SW: { start: 'S', end: 'W' },
  동남: { start: 'S', end: 'E' },
  동남쪽: { start: 'S', end: 'E' },
  동북: { start: 'N', end: 'E' },
  동북쪽: { start: 'N', end: 'E' },
  남동: { start: 'S', end: 'E' },
  남동쪽: { start: 'S', end: 'E' },
  남서: { start: 'S', end: 'W' },
  남서쪽: { start: 'S', end: 'W' },
  북동: { start: 'N', end: 'E' },
  북동쪽: { start: 'N', end: 'E' },
  북서: { start: 'N', end: 'W' },
  북서쪽: { start: 'N', end: 'W' },
  서남: { start: 'S', end: 'W' },
  서남쪽: { start: 'S', end: 'W' },
  서북: { start: 'N', end: 'W' },
  서북쪽: { start: 'N', end: 'W' },
};

const parseLongAxisOrientation = (
  value: string
): { start: string; degrees?: number; end: string } | undefined => {
  const normalizedValue = value.trim().replace(/[–—]/g, '-');
  const diagonalValue = parseDiagonalLongAxisOrientation(normalizedValue);
  if (diagonalValue) return diagonalValue;

  const quadrantValue = parseLongAxisOrientationQuadrant(normalizedValue);
  if (quadrantValue) return quadrantValue;

  const phraseMatch = normalizedValue.match(
    KOREAN_LONG_AXIS_ORIENTATION_PHRASE_PATTERN
  );
  const match = phraseMatch
    ? [phraseMatch[0], phraseMatch[1], phraseMatch[3], phraseMatch[2]]
    : normalizedValue.match(LONG_AXIS_ORIENTATION_PATTERN);

  if (!match) return undefined;

  const start = normalizeCardinalDirectionToken(match[1]);
  const end = normalizeCardinalDirectionToken(match[3]);
  const degrees = Number(match[2]);

  if (
    !start
    || !end
    || !Number.isInteger(degrees)
    || degrees < 0
    || degrees > 90
    || start === end
    || OPPOSITE_DIRECTION[start] === end
  ) {
    return undefined;
  }

  return { start, degrees, end };
};

const parseDiagonalLongAxisOrientation = (
  value: string
): { start: string; degrees?: number; end: string } | undefined => {
  const match = value.match(DIAGONAL_LONG_AXIS_ORIENTATION_PATTERN);
  const quadrantMatch = value.match(DIAGONAL_LONG_AXIS_ORIENTATION_QUADRANT_PATTERN);
  if (!match && !quadrantMatch) return undefined;

  const direction = getDiagonalDirection((match ?? quadrantMatch)?.[1] ?? '');
  const degrees = match ? Number(match[2]) : undefined;

  if (
    !direction
    || (
      degrees !== undefined
      && (!Number.isInteger(degrees) || degrees < 0 || degrees > 90)
    )
  ) {
    return undefined;
  }

  return {
    start: direction.start,
    degrees,
    end: direction.end,
  };
};

const parseLongAxisOrientationQuadrant = (
  value: string
): { start: string; end: string } | undefined => {
  const phraseMatch = value.match(KOREAN_LONG_AXIS_ORIENTATION_QUADRANT_PHRASE_PATTERN);
  const match = phraseMatch
    ? [phraseMatch[0], phraseMatch[1], phraseMatch[2]]
    : value.match(LONG_AXIS_ORIENTATION_QUADRANT_PATTERN);
  if (!match) return undefined;

  const start = normalizeCardinalDirectionToken(match[1]);
  const end = normalizeCardinalDirectionToken(match[2]);

  if (!start || !end || start === end || OPPOSITE_DIRECTION[start] === end) {
    return undefined;
  }

  return { start, end };
};

const normalizeCardinalDirectionToken = (value: string): string | undefined => {
  const normalizedValue = value.trim().toUpperCase();

  return /^[NSEW]$/.test(normalizedValue)
    ? normalizedValue
    : KOREAN_DIRECTION_TOKEN_MAP[value.trim()];
};

const getDiagonalDirection = (
  value: string
): { start: string; end: string } | undefined =>
  DIAGONAL_DIRECTION_TOKEN_MAP[value.trim().toUpperCase()]
  ?? DIAGONAL_DIRECTION_TOKEN_MAP[value.trim()];
