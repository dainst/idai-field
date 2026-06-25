import {
  createFeatureCandidateDraft,
  createLayerDraft,
  createOperationDraft,
  createSoilProfilePhotoDraft,
  createSurveyBoundaryDraft,
  FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
  FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
  FEATURE_RECORDING_STATUS_CANDIDATE,
  GEOMETRY_CONFIDENCE_ROUGH,
  GEOMETRY_SOURCE_GPS_APPROXIMATE,
  LAYER_SEQUENCE_MEANING_DEFAULT,
  REFERENCE_BASEMAP_PROVIDER_DEFAULT,
  REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID,
  SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS,
  SURVEY_BOUNDARY_ACCURACY_DEFAULT,
  SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER,
  SURVEY_BOUNDARY_SOURCE_DEFAULT,
  SURVEY_BOUNDARY_TYPE_DEFAULT,
  SOIL_COLOR_ASSIST_STATUS_DEFAULT,
} from './korean-fieldwork-drafts';
import {
  createOperationRelationUpdate,
  getOperationWrapConfirmationMessage,
  getLegacyRootDocumentsForOperation,
} from '../korean-fieldwork-operation-wrap';

describe('Korean fieldwork map drafts', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates Operation drafts as root field unit records', () => {
    const draft = createOperationDraft({
      now: new Date(2023, 10, 15, 7, 13, 20),
    });

    expect(draft.resource).toMatchObject({
      identifier: '조사구역-20231115-071320',
      category: 'Operation',
      relations: {},
    });
  });

  it('describes wrapped legacy roots in Operation drafts', () => {
    const draft = createOperationDraft({
      legacyRootDocumentCount: 4,
      now: new Date(2023, 10, 15, 7, 13, 20),
    });

    expect(draft.resource).toMatchObject({
      identifier: '조사구역-20231115-071320',
      shortDescription: '기존 기록 4건을 유지하고 새 조사 경계 기준을 만들었습니다.',
    });
  });

  it('copies project setup defaults into Operation drafts', () => {
    const draft = createOperationDraft({
      investigationModeId: 'trialTrench',
      boundarySummary: '  1구역 북쪽 능선부터 남쪽 농로까지  ',
      now: new Date(2023, 10, 15, 7, 13, 20),
    });

    expect(draft.resource).toMatchObject({
      identifier: '조사구역-20231115-071320',
      projectInvestigationMode: 'trialTrench',
      projectBoundarySetupState: 'draftBoundary',
      projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
      shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
    });
  });

  it('keeps legacy wrapping context when project boundary defaults are present', () => {
    const draft = createOperationDraft({
      legacyRootDocumentCount: 4,
      boundarySummary: '1구역 북쪽 능선',
      now: new Date(2023, 10, 15, 7, 13, 20),
    });

    expect(draft.resource.shortDescription)
      .toBe('1구역 북쪽 능선 · 기존 기록 4건 유지');
  });

  it('creates Feature candidate drafts with a pending feature type and empty investigation checklist', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createFeatureCandidateDraft(operationDoc, { x: 127, y: 37 });

    expect(draft.resource).toMatchObject({
      identifier: '유구-1700000000000',
      category: 'Feature',
      relations: { isRecordedIn: ['operation-1'] },
      geometry: {
        type: 'Point',
        coordinates: [127, 37],
      },
      featureType: 'unknown',
      featureRecordingStatus: FEATURE_RECORDING_STATUS_CANDIDATE,
      geometrySource: GEOMETRY_SOURCE_GPS_APPROXIMATE,
      geometryConfidence: GEOMETRY_CONFIDENCE_ROUGH,
      featureGeometryEditStatus: FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
      featureGeometryRevisionHistory: FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
      featureInvestigationChecklist: [],
      featureSoilProfilePhotoCount: 0,
    });
  });

  it('creates map Feature drafts with the selected feature type when provided', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createFeatureCandidateDraft(
      operationDoc,
      { x: 127, y: 37 },
      'ditch'
    );

    expect(draft.resource).toMatchObject({
      identifier: '구상유구-1700000000000',
      featureType: 'ditch',
      featureInterpretationType: ['ditchOrGully'],
    });
  });

  it('finds only legacy root field records that need an operation parent', () => {
    const rootTrench = createDocument('trench-1', 'Trench');
    const nestedFeature = createDocument('feature-1', 'Feature', {
      liesWithin: ['trench-1'],
    });
    const rootFind = createDocument('find-1', 'Find');
    const mapLayer = createDocument('map-layer-1', 'AerialMapLayer');
    const sourceIndex = createDocument('source-1', 'SourceEvidenceIndex');
    const operation = createDocument('operation-1', 'Operation');

    expect(getLegacyRootDocumentsForOperation([
      rootTrench,
      nestedFeature,
      rootFind,
      mapLayer,
      sourceIndex,
      operation,
    ])).toEqual([rootTrench, rootFind]);
  });

  it('adds an operation parent relation while preserving existing fields', () => {
    const legacyDocument = createDocument('trench-1', 'Trench', {
      customRelation: ['target-1'],
    });
    const operation = createDocument('operation-1', 'Operation');

    expect(createOperationRelationUpdate(legacyDocument, operation).resource)
      .toMatchObject({
        id: 'trench-1',
        category: 'Trench',
        relations: {
          customRelation: ['target-1'],
          isRecordedIn: ['operation-1'],
        },
      });
  });

  it('explains legacy operation wrapping before changing relations', () => {
    expect(getOperationWrapConfirmationMessage(4))
      .toBe('4개 기존 기록의 내용은 유지합니다. 조사 경계를 만들고 이후 기록을 그 기준 아래에 이어서 남깁니다.');
  });

  it('creates an offline-safe soil profile photo draft linked to the highlighted document', () => {
    const targetDoc = {
      resource: {
        id: 'feature-1',
        category: 'Feature',
      },
    } as any;

    const draft = createSoilProfilePhotoDraft(targetDoc);

    expect(draft.resource).toMatchObject({
      identifier: 'soil-profile-photo-1700000000000',
      category: 'SoilProfilePhoto',
      relations: { depicts: ['feature-1'] },
      soilProfileAnnotationStrokes: '[]',
      soilProfileLayerMarkers: '[]',
      soilProfileLayerIds: '[]',
      soilProfileColorSwatches: '[]',
      soilColorAssistCandidates: '',
      soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
      soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
      soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
    });
  });

  it('creates Layer drafts with latest-to-earliest numbering and soil color assistance disabled by default', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createLayerDraft(operationDoc, 1);

    expect(draft.resource).toMatchObject({
      identifier: 'layer-1700000000000-1',
      category: 'Layer',
      relations: { isRecordedIn: ['operation-1'] },
      layerSequenceNumber: 1,
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
      soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
    });
  });

  it('keeps nested Layer drafts tied to the operation and parent feature', () => {
    const featureDoc = {
      resource: {
        id: 'feature-1',
        category: 'Feature',
        relations: {
          isRecordedIn: ['operation-1'],
        },
      },
    } as any;

    const draft = createLayerDraft(featureDoc, 2);

    expect(draft.resource.relations).toEqual({
      isRecordedIn: ['operation-1'],
      liesWithin: ['feature-1'],
    });
  });

  it('creates SurveyBoundary drafts as operation-level line boundary records', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createSurveyBoundaryDraft(operationDoc);

    expect(draft.resource).toMatchObject({
      identifier: 'survey-boundary-1700000000000',
      category: 'SurveyBoundary',
      relations: { isRecordedIn: ['operation-1'] },
      surveyBoundaryType: SURVEY_BOUNDARY_TYPE_DEFAULT,
      surveyBoundarySource: SURVEY_BOUNDARY_SOURCE_DEFAULT,
      surveyBoundaryAccuracy: SURVEY_BOUNDARY_ACCURACY_DEFAULT,
      referenceBasemapProvider: REFERENCE_BASEMAP_PROVIDER_DEFAULT,
    });
    expect(draft.resource.geometry).toBeUndefined();
  });

  it('names the Kakao satellite provider value used by map boundary drafts', () => {
    expect(REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID).toBe('kakaoHybrid');
  });

  it('copies the project boundary summary into SurveyBoundary drafts', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createSurveyBoundaryDraft(
      operationDoc,
      undefined,
      '  1구역 북쪽 능선부터 남쪽 농로까지  '
    );

    expect(draft.resource).toMatchObject({
      shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
      surveyBoundaryNote: '1구역 북쪽 능선부터 남쪽 농로까지',
    });
  });

  it('creates SurveyBoundary drafts around the current GPS position when available', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createSurveyBoundaryDraft(operationDoc, { x: 1000, y: 2000 });

    expect(draft.resource).toMatchObject({
      surveyBoundarySource: SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER,
      surveyBoundaryAccuracy: SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS,
      geometry: {
        type: 'LineString',
        coordinates: [
          [980, 1980],
          [1020, 1980],
          [1020, 2020],
          [980, 2020],
          [980, 1980],
        ],
      },
    });
  });

  it('keeps Kakao satellite boundary drafts distinct from GPS walkover drafts', () => {
    const operationDoc = {
      resource: {
        id: 'operation-1',
        category: 'Operation',
        relations: {},
      },
    } as any;

    const draft = createSurveyBoundaryDraft(
      operationDoc,
      { x: 1000, y: 2000 },
      'A구역',
      {
        boundaryAccuracy: SURVEY_BOUNDARY_ACCURACY_DEFAULT,
        boundarySource: SURVEY_BOUNDARY_SOURCE_DEFAULT,
        referenceBasemapProvider: REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID,
      }
    );

    expect(draft.resource).toMatchObject({
      referenceBasemapProvider: REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID,
      surveyBoundaryAccuracy: SURVEY_BOUNDARY_ACCURACY_DEFAULT,
      surveyBoundarySource: SURVEY_BOUNDARY_SOURCE_DEFAULT,
    });
  });
});

const createDocument = (
  id: string,
  category: string,
  relations: Record<string, string[]> = {}
) => ({
  resource: {
    id,
    identifier: id,
    category,
    relations,
  },
} as any);
