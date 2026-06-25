import {
  CategoryForm,
  Resource,
} from 'idai-field-core';
import {
  FIELDWORK_QUICK_FIELDS,
  describeKoreanFieldworkLongAxisOrientation,
  getKoreanFieldworkChecklistQuickOptions,
  getKoreanFieldworkFeatureTypeUpdates,
  getKoreanFieldworkQuickRecordAvailability,
  getKoreanFieldworkQuickPresetUpdates,
  getStringArrayFieldValues,
  hasKoreanFieldworkQuickRecordActions,
  isKoreanFieldworkLongAxisOrientation,
  isKoreanFieldworkChecklistRecord,
  LONG_AXIS_ORIENTATION_QUICK_OPTIONS,
  normalizeKoreanFieldworkLongAxisOrientation,
  toggleStringArrayFieldValue,
} from './korean-fieldwork-quick-record';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork quick record helpers', () => {
  it('shows feature workflow checks only when the feature form has the checklist field', () => {
    const category = createCategoryForm([
      FIELDWORK_QUICK_FIELDS.checklist,
      FIELDWORK_QUICK_FIELDS.quality,
      FIELDWORK_QUICK_FIELDS.verification,
      FIELDWORK_QUICK_FIELDS.timing,
    ]);

    const availability = getKoreanFieldworkQuickRecordAvailability(
      category,
      createResource(C.FEATURE)
    );

    expect(availability).toEqual({
      checklist: true,
      featureType: false,
      featureStatus: false,
      axisOrientation: false,
      period: false,
      quality: true,
      verification: true,
      timing: true,
    });
    expect(hasKoreanFieldworkQuickRecordActions(availability)).toBe(true);
  });

  it('hides checks that are not present on the active category form', () => {
    const availability = getKoreanFieldworkQuickRecordAvailability(
      createCategoryForm([FIELDWORK_QUICK_FIELDS.quality]),
      createResource(C.TRENCH)
    );

    expect(availability).toEqual({
      checklist: false,
      featureType: false,
      featureStatus: false,
      axisOrientation: false,
      period: false,
      quality: true,
      verification: false,
      timing: false,
    });
  });

  it('keeps the feature checklist off non-feature workflow records', () => {
    const availability = getKoreanFieldworkQuickRecordAvailability(
      createCategoryForm([FIELDWORK_QUICK_FIELDS.checklist]),
      createResource(C.FEATURE_GROUP)
    );

    expect(availability.checklist).toBe(false);
    expect(hasKoreanFieldworkQuickRecordActions(availability)).toBe(false);
  });

  it('shows verification as a standalone quick action for fieldwork records', () => {
    const availability = getKoreanFieldworkQuickRecordAvailability(
      createCategoryForm([FIELDWORK_QUICK_FIELDS.verification]),
      createResource(C.TRENCH)
    );

    expect(availability).toEqual({
      checklist: false,
      featureType: false,
      featureStatus: false,
      axisOrientation: false,
      period: false,
      quality: false,
      verification: true,
      timing: false,
    });
    expect(hasKoreanFieldworkQuickRecordActions(availability)).toBe(true);
  });

  it('treats trenches as checklist records only in trial trench mode', () => {
    const category = createCategoryForm([
      FIELDWORK_QUICK_FIELDS.checklist,
      FIELDWORK_QUICK_FIELDS.timing,
    ]);

    expect(isKoreanFieldworkChecklistRecord(C.TRENCH)).toBe(false);
    expect(isKoreanFieldworkChecklistRecord(C.TRENCH, 'trialTrench')).toBe(true);
    expect(getKoreanFieldworkQuickRecordAvailability(
      category,
      createResource(C.TRENCH),
      'trialTrench'
    )).toMatchObject({
      checklist: true,
      featureStatus: false,
      timing: true,
    });
  });

  it('shows feature status quick actions only when the form exposes the status field', () => {
    const availability = getKoreanFieldworkQuickRecordAvailability(
      createCategoryForm([FIELDWORK_QUICK_FIELDS.featureStatus]),
      createResource(C.FEATURE)
    );

    expect(availability).toEqual({
      checklist: false,
      featureType: false,
      featureStatus: true,
      axisOrientation: false,
      period: false,
      quality: false,
      verification: false,
      timing: false,
    });
    expect(hasKoreanFieldworkQuickRecordActions(availability)).toBe(true);
  });

  it('shows long-axis orientation quick input for axis-aware field records', () => {
    const availability = getKoreanFieldworkQuickRecordAvailability(
      createCategoryForm([FIELDWORK_QUICK_FIELDS.longAxisOrientation]),
      createResource(C.FEATURE)
    );

    expect(availability).toEqual({
      checklist: false,
      featureType: false,
      featureStatus: false,
      axisOrientation: true,
      period: false,
      quality: false,
      verification: false,
      timing: false,
    });
    expect(hasKoreanFieldworkQuickRecordActions(availability)).toBe(true);
  });

  it('normalizes quadrant-bearing long-axis orientation entries', () => {
    expect(LONG_AXIS_ORIENTATION_QUICK_OPTIONS.map((option) => option.value))
      .toEqual([
        'N-E',
        'N-W',
        'S-E',
        'S-W',
      ]);
    expect(normalizeKoreanFieldworkLongAxisOrientation('n-e'))
      .toBe('N-E');
    expect(normalizeKoreanFieldworkLongAxisOrientation('북에서 동쪽으로'))
      .toBe('N-E');
    expect(normalizeKoreanFieldworkLongAxisOrientation('남서'))
      .toBe('S-W');
    expect(normalizeKoreanFieldworkLongAxisOrientation('n-23도-e'))
      .toBe('N-23°-E');
    expect(normalizeKoreanFieldworkLongAxisOrientation('북 23도 동'))
      .toBe('N-23°-E');
    expect(normalizeKoreanFieldworkLongAxisOrientation('북에서 동쪽으로 23도'))
      .toBe('N-23°-E');
    expect(normalizeKoreanFieldworkLongAxisOrientation('NE 23'))
      .toBe('N-23°-E');
    expect(normalizeKoreanFieldworkLongAxisOrientation('북동 23도'))
      .toBe('N-23°-E');
    expect(normalizeKoreanFieldworkLongAxisOrientation('남-45-서'))
      .toBe('S-45°-W');
    expect(normalizeKoreanFieldworkLongAxisOrientation('남서 45도'))
      .toBe('S-45°-W');
    expect(normalizeKoreanFieldworkLongAxisOrientation('S 45 W'))
      .toBe('S-45°-W');
    expect(normalizeKoreanFieldworkLongAxisOrientation('N-120°-E'))
      .toBe('N-120°-E');
    expect(isKoreanFieldworkLongAxisOrientation('N-23°-E')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('N-E')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('북에서 동쪽으로')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('N-23도-E')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('북 23도 동')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('북에서 동쪽으로 23도')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('NE 23')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('북동 23도')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('남서 45도')).toBe(true);
    expect(isKoreanFieldworkLongAxisOrientation('북-23도-남')).toBe(false);
    expect(isKoreanFieldworkLongAxisOrientation('N-23°-S')).toBe(false);
    expect(isKoreanFieldworkLongAxisOrientation('N-120°-E')).toBe(false);
  });

  it('describes valid long-axis orientation entries in Korean', () => {
    expect(describeKoreanFieldworkLongAxisOrientation('N-23°-E'))
      .toBe('N-23°-E = 북에서 동쪽으로 23°');
    expect(describeKoreanFieldworkLongAxisOrientation('N-E'))
      .toBe('N-E = 북에서 동쪽으로 기운 장축');
    expect(describeKoreanFieldworkLongAxisOrientation('남서 45도'))
      .toBe('S-45°-W = 남에서 서쪽으로 45°');
    expect(describeKoreanFieldworkLongAxisOrientation('N-120°-E'))
      .toBeUndefined();
  });

  it('toggles string-array field values and ignores malformed entries', () => {
    const resource = createResource(C.FEATURE, {
      fieldRecordQuality: [
        'immediateRecording',
        7,
        'observationInterpretationSeparated',
      ],
    });

    expect(getStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.quality
    )).toEqual(['immediateRecording', 'observationInterpretationSeparated']);

    expect(toggleStringArrayFieldValue(
      resource,
      FIELDWORK_QUICK_FIELDS.quality,
      'immediateRecording'
    )).toEqual(['observationInterpretationSeparated']);

    expect(toggleStringArrayFieldValue(
      resource,
      FIELDWORK_QUICK_FIELDS.quality,
      'correctionNeeded'
    )).toEqual([
      'immediateRecording',
      'observationInterpretationSeparated',
      'correctionNeeded',
    ]);
  });

  it('builds feature type updates without overwriting unrelated interpretation values', () => {
    const resource = createResource(C.FEATURE, {
      featureType: 'unknown',
      featureInterpretationType: ['pitFeature', 'other'],
    });

    expect(getKoreanFieldworkFeatureTypeUpdates(resource, 'posthole')).toEqual({
      featureType: 'posthole',
      featureInterpretationType: ['other', 'posthole'],
    });

    expect(getKoreanFieldworkFeatureTypeUpdates(resource, 'unknown')).toEqual({
      featureType: 'unknown',
      featureInterpretationType: ['other'],
    });
  });

  it('builds safe start and closeout preset updates from available fields', () => {
    const resource = createResource(C.FEATURE, {
      featureInvestigationChecklist: ['preInvestigationPhotoTaken'],
      fieldRecordQuality: ['immediateRecording'],
      verificationState: 'pendingDecision',
      recordCreationTiming: '',
    });
    const availability = {
      checklist: true,
      featureType: false,
      featureStatus: true,
      axisOrientation: false,
      period: false,
      quality: true,
      verification: false,
      timing: true,
    };

    expect(getKoreanFieldworkQuickPresetUpdates(
      resource,
      availability,
      'startFeatureInvestigation'
    )).toEqual({
      featureRecordingStatus: 'investigating',
      featureInvestigationChecklist: [
        'preInvestigationPhotoTaken',
        'inProgressPhotoTaken',
      ],
      fieldRecordQuality: ['immediateRecording'],
      recordCreationTiming: 'duringFieldwork',
    });

    expect(getKoreanFieldworkQuickPresetUpdates(
      {
        ...resource,
        recordCreationTiming: 'sameDayFieldRecord',
        verificationState: 'needsRecheck',
      },
      availability,
      'closeFeatureInvestigation'
    )).toEqual({
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: [
        'preInvestigationPhotoTaken',
        'completionPhotoTaken',
        'measuredDrawingCompleted',
      ],
      fieldRecordQuality: [
        'immediateRecording',
        'observationInterpretationSeparated',
      ],
    });
  });

  it('uses investigation-specific checklist labels and values', () => {
    expect(getKoreanFieldworkChecklistQuickOptions('trialTrench')).toEqual([
      { value: 'trenchSoilCleaned', label: '토층 정리' },
      { value: 'trenchFeatureChecked', label: '유구 확인' },
      { value: 'trenchPitOpened', label: '피트 조사' },
      { value: 'trenchPitProfileDrawn', label: '피트 토층도' },
      { value: 'trenchOverviewPhotoTaken', label: '정방향 사진' },
      { value: 'trenchObliquePhotoTaken', label: '사선 사진' },
      { value: 'soilProfilePhotoLinked', label: '기준 토층사진' },
      { value: 'inProgressPhotoTaken', label: '유구 사진' },
      { value: 'penMemoReviewed', label: '펜메모 검토' },
    ]);
    expect(getKoreanFieldworkChecklistQuickOptions('excavation')
      .map((option) => option.value)).toEqual([
      'preInvestigationPhotoTaken',
      'inProgressPhotoTaken',
      'soilProfilePhotoLinked',
      'preRecoveryFindPhotoTaken',
      'findsRecovered',
      'samplesCollected',
      'completionPhotoTaken',
      'measuredDrawingCompleted',
      'penMemoReviewed',
    ]);
  });

  it('applies mode-aware preset checklist updates', () => {
    const resource = createResource(C.FEATURE, {
      featureInvestigationChecklist: ['preInvestigationPhotoTaken'],
      fieldRecordQuality: [],
      recordCreationTiming: '',
    });
    const availability = {
      checklist: true,
      featureType: false,
      featureStatus: true,
      axisOrientation: false,
      period: false,
      quality: true,
      verification: false,
      timing: true,
    };

    expect(getKoreanFieldworkQuickPresetUpdates(
      resource,
      availability,
      'startFeatureInvestigation',
      'trialTrench'
    ).featureInvestigationChecklist).toEqual([
      'preInvestigationPhotoTaken',
      'trenchSoilCleaned',
      'trenchFeatureChecked',
    ]);

    expect(getKoreanFieldworkQuickPresetUpdates(
      resource,
      availability,
      'closeFeatureInvestigation',
      'trialTrench'
    ).featureInvestigationChecklist).toEqual([
      'preInvestigationPhotoTaken',
      'trenchPitOpened',
      'trenchPitProfileDrawn',
      'trenchOverviewPhotoTaken',
      'trenchObliquePhotoTaken',
      'soilProfilePhotoLinked',
      'inProgressPhotoTaken',
    ]);
  });
});

const createCategoryForm = (fieldNames: string[]): CategoryForm => ({
  groups: [
    {
      name: 'fieldwork',
      fields: fieldNames.map((name) => ({ name })),
    },
  ],
} as CategoryForm);

const createResource = (
  category: string,
  extraResource: Record<string, unknown> = {}
): Resource => ({
  id: 'resource-1',
  identifier: '기록 1',
  category,
  relations: {},
  ...extraResource,
} as unknown as Resource);
