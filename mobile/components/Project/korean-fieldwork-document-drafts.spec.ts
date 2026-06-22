import {
  createDraftIdentifier,
  createKoreanFieldworkDraftRelations,
  createKoreanFieldworkDraftResource,
} from './korean-fieldwork-document-drafts';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
  FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
  FEATURE_RECORDING_STATUS_CANDIDATE,
  LAYER_SEQUENCE_MEANING_DEFAULT,
  REFERENCE_BASEMAP_PROVIDER_DEFAULT,
  SOIL_COLOR_ASSIST_STATUS_DEFAULT,
  SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  SURVEY_BOUNDARY_ACCURACY_DEFAULT,
  SURVEY_BOUNDARY_SOURCE_DEFAULT,
  SURVEY_BOUNDARY_TYPE_DEFAULT,
} from './Map/korean-fieldwork-drafts';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork document drafts', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates immediately saveable Trench drafts below operation records', () => {
    const operationDoc = createDoc('operation-1', C.OPERATION);
    const config = allowRelations({
      [`${C.TRENCH}:${C.OPERATION}`]: ['isRecordedIn', 'liesWithin'],
    });

    const draft = createKoreanFieldworkDraftResource(
      operationDoc,
      C.TRENCH,
      config
    );

    expect(draft).toMatchObject({
      identifier: 'trench-1700000000000',
      category: C.TRENCH,
      relations: {
        isRecordedIn: ['operation-1'],
        liesWithin: ['operation-1'],
      },
      recordCreationTiming: 'duringFieldwork',
      fieldRecordQuality: [],
      verificationState: 'pendingDecision',
    });
  });

  it('keeps FeatureSegment pit/detail drafts linked to their operation and parent feature', () => {
    const featureDoc = createDoc('feature-1', C.FEATURE, {
      isRecordedIn: ['operation-1'],
    });
    const config = allowRelations({
      [`${C.FEATURE_SEGMENT}:${C.FEATURE}`]: ['liesWithin'],
    });

    const draft = createKoreanFieldworkDraftResource(
      featureDoc,
      C.FEATURE_SEGMENT,
      config
    );

    expect(draft).toMatchObject({
      identifier: 'feature-segment-1700000000000',
      category: C.FEATURE_SEGMENT,
      relations: {
        isRecordedIn: ['operation-1'],
        liesWithin: ['feature-1'],
      },
      featureRecordingStatus: FEATURE_RECORDING_STATUS_CANDIDATE,
      featureGeometryEditStatus: FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
      featureGeometryRevisionHistory: FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
      featureInvestigationChecklist: [],
      featureSoilProfilePhotoCount: 0,
    });
  });

  it('creates Layer drafts with tablet-friendly sequence defaults', () => {
    const featureDoc = createDoc('feature-1', C.FEATURE, {
      isRecordedIn: ['operation-1'],
    });
    const config = allowRelations({
      [`${C.LAYER}:${C.FEATURE}`]: ['liesWithin'],
    });

    const draft = createKoreanFieldworkDraftResource(
      featureDoc,
      C.LAYER,
      config
    );

    expect(draft).toMatchObject({
      identifier: 'layer-1700000000000',
      category: C.LAYER,
      relations: {
        isRecordedIn: ['operation-1'],
        liesWithin: ['feature-1'],
      },
      layerSequenceNumber: 1,
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
      soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
    });
  });

  it('creates offline-safe soil profile photo drafts from regular add flow', () => {
    const featureDoc = createDoc('feature-1', C.FEATURE);
    const config = allowRelations({
      [`${C.SOIL_PROFILE_PHOTO}:${C.FEATURE}`]: ['depicts'],
    });

    const draft = createKoreanFieldworkDraftResource(
      featureDoc,
      C.SOIL_PROFILE_PHOTO,
      config
    );

    expect(draft).toMatchObject({
      identifier: 'soil-profile-photo-1700000000000',
      category: C.SOIL_PROFILE_PHOTO,
      relations: { depicts: ['feature-1'] },
      soilProfileAnnotationStrokes: '[]',
      soilProfileLayerMarkers: '[]',
      soilProfileLayerIds: '[]',
      soilProfileColorSwatches: '[]',
      soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
      soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
    });
  });

  it('creates regular Photo drafts with fieldwork capture defaults', () => {
    const trenchDoc = createDoc('trench-1', C.TRENCH);
    const config = allowRelations({
      [`${C.PHOTO}:${C.TRENCH}`]: ['depicts'],
    });

    const draft = createKoreanFieldworkDraftResource(
      trenchDoc,
      C.PHOTO,
      config
    );

    expect(draft).toMatchObject({
      identifier: 'photo-1700000000000',
      category: C.PHOTO,
      relations: { depicts: ['trench-1'] },
      fieldworkPhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
      fieldworkPhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
      mediaEvidenceRole: ['fieldResultRecord'],
    });
  });

  it('creates SurveyBoundary drafts with operation-level boundary defaults', () => {
    const operationDoc = createDoc('operation-1', C.OPERATION);
    const config = allowRelations({
      [`${C.SURVEY_BOUNDARY}:${C.OPERATION}`]: ['isRecordedIn'],
    });

    const draft = createKoreanFieldworkDraftResource(
      operationDoc,
      C.SURVEY_BOUNDARY,
      config
    );

    expect(draft).toMatchObject({
      identifier: 'survey-boundary-1700000000000',
      category: C.SURVEY_BOUNDARY,
      relations: { isRecordedIn: ['operation-1'] },
      surveyBoundaryType: SURVEY_BOUNDARY_TYPE_DEFAULT,
      surveyBoundarySource: SURVEY_BOUNDARY_SOURCE_DEFAULT,
      surveyBoundaryAccuracy: SURVEY_BOUNDARY_ACCURACY_DEFAULT,
      referenceBasemapProvider: REFERENCE_BASEMAP_PROVIDER_DEFAULT,
    });
  });

  it('creates PenMemo drafts with empty stroke data', () => {
    const featureDoc = createDoc('feature-1', C.FEATURE);
    const config = allowRelations({
      [`${C.PEN_MEMO}:${C.FEATURE}`]: ['depicts'],
    });

    const draft = createKoreanFieldworkDraftResource(
      featureDoc,
      C.PEN_MEMO,
      config
    );

    expect(draft).toMatchObject({
      identifier: 'pen-memo-1700000000000',
      category: C.PEN_MEMO,
      relations: { depicts: ['feature-1'] },
      penMemoStrokes: '[]',
      penMemoTranscriptionStatus: 'pending',
    });
  });

  it('falls back to inherited operation context when no direct relation is configured', () => {
    const featureDoc = createDoc('feature-1', C.FEATURE, {
      isRecordedIn: ['operation-1'],
    });
    const config = allowRelations({});

    expect(
      createKoreanFieldworkDraftRelations(featureDoc, C.FIND, config)
    ).toEqual({
      isRecordedIn: ['operation-1'],
      liesWithin: ['feature-1'],
    });
  });

  it('uses kebab-case identifiers for categories without a dedicated prefix', () => {
    expect(createDraftIdentifier('CustomRecordType')).toBe(
      'custom-record-type-1700000000000'
    );
  });
});

const createDoc = (
  id: string,
  category: string,
  relations: Record<string, string[]> = {}
) => ({
  resource: {
    id,
    category,
    relations,
  },
} as any);

const allowRelations = (allowed: Record<string, string[]>) => ({
  isAllowedRelationDomainCategory: (
    categoryName: string,
    parentCategoryName: string,
    relationName: string
  ) => (allowed[`${categoryName}:${parentCategoryName}`] ?? [])
    .includes(relationName),
} as any);
