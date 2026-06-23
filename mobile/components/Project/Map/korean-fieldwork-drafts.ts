import {
  Document,
  NewDocument,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from '../korean-fieldwork-categories';
import { getKoreanFieldworkFeatureTypeOption } from '../korean-fieldwork-feature-types';

export const LAYER_SEQUENCE_MEANING_DEFAULT = 'latestToEarliest';
export const SOIL_COLOR_ASSIST_STATUS_DEFAULT = 'notRun';
export const SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT = 512;
export const SOIL_PROFILE_PHOTO_QUALITY_DEFAULT = 0.35;
export const SURVEY_BOUNDARY_TYPE_DEFAULT = 'operationBoundary';
export const SURVEY_BOUNDARY_SOURCE_DEFAULT = 'manualBasemapTrace';
export const SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER = 'gpsWalkover';
export const SURVEY_BOUNDARY_ACCURACY_DEFAULT = 'visualReference';
export const SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS = 'approximateGps';
export const REFERENCE_BASEMAP_PROVIDER_DEFAULT = 'none';
export const FEATURE_RECORDING_STATUS_CANDIDATE = 'candidate';
export const GEOMETRY_SOURCE_GPS_APPROXIMATE = 'gpsApproximate';
export const GEOMETRY_CONFIDENCE_ROUGH = 'rough';
export const FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH = 'roughSketch';
export const FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT = '[]';
export const GPS_DRAFT_BOUNDARY_HALF_SIZE_METERS = 20;

export type MapLocation = { x: number; y: number };

export const createOperationDraft = (): NewDocument => ({
  resource: {
    identifier: `operation-${Date.now()}`,
    category: KOREAN_FIELDWORK_CATEGORIES.OPERATION,
    relations: {},
  },
});

export const createDepictsRelation = (targetDoc: Document): { depicts: string[] } => ({
  depicts: [targetDoc.resource.id],
});

export const createKoreanFieldworkChildRelations = (
  parentDoc: Document
): { [relationName: string]: string[] } => {
  const parentRelations = parentDoc.resource.relations ?? {};

  if (!parentRelations.isRecordedIn) return { isRecordedIn: [parentDoc.resource.id] };

  return {
    isRecordedIn: [parentRelations.isRecordedIn[0]],
    liesWithin: [parentDoc.resource.id],
  };
};

export const createSoilProfilePhotoDraft = (targetDoc: Document): NewDocument => ({
  resource: {
    identifier: `soil-profile-photo-${Date.now()}`,
    category: KOREAN_FIELDWORK_CATEGORIES.SOIL_PROFILE_PHOTO,
    relations: createDepictsRelation(targetDoc),
    soilProfileAnnotationStrokes: '[]',
    soilProfileLayerMarkers: '[]',
    soilProfileLayerIds: '[]',
    soilProfileColorSwatches: '[]',
    soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
    soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
    layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
  },
});

export const createLayerDraft = (
  parentDoc: Document,
  sequenceNumber: number
): NewDocument => ({
  resource: {
    identifier: `layer-${Date.now()}-${sequenceNumber}`,
    category: KOREAN_FIELDWORK_CATEGORIES.LAYER,
    relations: createKoreanFieldworkChildRelations(parentDoc),
    layerSequenceNumber: sequenceNumber,
    layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
    soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
  },
});

export const createFeatureCandidateDraft = (
  parentDoc: Document,
  location: MapLocation,
  featureType = 'unknown'
): NewDocument => {
  const featureTypeOption = getKoreanFieldworkFeatureTypeOption(featureType);

  return {
    resource: {
      identifier: `${featureTypeOption?.identifierPrefix ?? 'feature-candidate'}-${Date.now()}`,
      category: KOREAN_FIELDWORK_CATEGORIES.FEATURE,
      relations: createKoreanFieldworkChildRelations(parentDoc),
      geometry: {
        type: 'Point',
        coordinates: [location.x, location.y],
      },
      ...(featureTypeOption ? { featureType: featureTypeOption.value } : {}),
      featureRecordingStatus: FEATURE_RECORDING_STATUS_CANDIDATE,
      geometrySource: GEOMETRY_SOURCE_GPS_APPROXIMATE,
      geometryConfidence: GEOMETRY_CONFIDENCE_ROUGH,
      featureGeometryEditStatus: FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
      featureGeometryRevisionHistory: FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
      featureInvestigationChecklist: [],
      featureSoilProfilePhotoCount: 0,
    },
  };
};

export const createSurveyBoundaryDraft = (
  parentDoc: Document,
  location?: MapLocation
): NewDocument => ({
  resource: {
    identifier: `survey-boundary-${Date.now()}`,
    category: KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY,
    relations: createKoreanFieldworkChildRelations(parentDoc),
    ...(location ? {
      geometry: createGpsDraftBoundaryGeometry(location),
    } : {}),
    surveyBoundaryType: SURVEY_BOUNDARY_TYPE_DEFAULT,
    surveyBoundarySource: location
      ? SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER
      : SURVEY_BOUNDARY_SOURCE_DEFAULT,
    surveyBoundaryAccuracy: location
      ? SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS
      : SURVEY_BOUNDARY_ACCURACY_DEFAULT,
    referenceBasemapProvider: REFERENCE_BASEMAP_PROVIDER_DEFAULT,
  },
});

export const createGpsDraftBoundaryGeometry = (
  location: MapLocation,
  halfSize = GPS_DRAFT_BOUNDARY_HALF_SIZE_METERS
) => ({
  type: 'LineString' as const,
  coordinates: [
    [location.x - halfSize, location.y - halfSize],
    [location.x + halfSize, location.y - halfSize],
    [location.x + halfSize, location.y + halfSize],
    [location.x - halfSize, location.y + halfSize],
    [location.x - halfSize, location.y - halfSize],
  ],
});
