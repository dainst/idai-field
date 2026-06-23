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
  SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS,
  SURVEY_BOUNDARY_ACCURACY_DEFAULT,
  SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER,
  SURVEY_BOUNDARY_SOURCE_DEFAULT,
  SURVEY_BOUNDARY_TYPE_DEFAULT,
  SOIL_COLOR_ASSIST_STATUS_DEFAULT,
} from './korean-fieldwork-drafts';

describe('Korean fieldwork map drafts', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates Operation drafts as root 조사구역 records', () => {
    const draft = createOperationDraft();

    expect(draft.resource).toMatchObject({
      identifier: 'operation-1700000000000',
      category: 'Operation',
      relations: {},
    });
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
    });
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
});
