import {
  CategoryForm,
  Resource,
} from 'idai-field-core';
import {
  FIELDWORK_QUICK_FIELDS,
  getKoreanFieldworkQuickRecordAvailability,
  getKoreanFieldworkQuickPresetUpdates,
  getStringArrayFieldValues,
  hasKoreanFieldworkQuickRecordActions,
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
      featureStatus: false,
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
      featureStatus: false,
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

  it('shows feature status quick actions only when the form exposes the status field', () => {
    const availability = getKoreanFieldworkQuickRecordAvailability(
      createCategoryForm([FIELDWORK_QUICK_FIELDS.featureStatus]),
      createResource(C.FEATURE)
    );

    expect(availability).toEqual({
      checklist: false,
      featureStatus: true,
      quality: false,
      verification: false,
      timing: false,
    });
    expect(hasKoreanFieldworkQuickRecordActions(availability)).toBe(true);
  });

  it('toggles string-array field values and ignores malformed entries', () => {
    const resource = createResource(C.FEATURE, {
      fieldRecordQuality: [
        'immediateRecording',
        7,
        'factualAccuracy',
      ],
    });

    expect(getStringArrayFieldValues(
      resource,
      FIELDWORK_QUICK_FIELDS.quality
    )).toEqual(['immediateRecording', 'factualAccuracy']);

    expect(toggleStringArrayFieldValue(
      resource,
      FIELDWORK_QUICK_FIELDS.quality,
      'immediateRecording'
    )).toEqual(['factualAccuracy']);

    expect(toggleStringArrayFieldValue(
      resource,
      FIELDWORK_QUICK_FIELDS.quality,
      'correctionNeeded'
    )).toEqual([
      'immediateRecording',
      'factualAccuracy',
      'correctionNeeded',
    ]);
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
      featureStatus: true,
      quality: true,
      verification: true,
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
      verificationState: 'observedInField',
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
        'factualAccuracy',
        'observationInterpretationSeparated',
        'fieldToReportContinuity',
      ],
    });
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
