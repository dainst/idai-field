import {
  Document,
  KOREAN_FIELDWORK_FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
  KOREAN_FIELDWORK_FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
  KOREAN_FIELDWORK_FEATURE_RECORDING_STATUS_CANDIDATE,
  KOREAN_FIELDWORK_GEOMETRY_CONFIDENCE_ROUGH,
  KOREAN_FIELDWORK_GEOMETRY_SOURCE_GPS_APPROXIMATE,
  KOREAN_FIELDWORK_GPS_DRAFT_BOUNDARY_HALF_SIZE_METERS,
  KOREAN_FIELDWORK_LAYER_SEQUENCE_MEANING_DEFAULT,
  KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_DEFAULT,
  KOREAN_FIELDWORK_SOIL_COLOR_ASSIST_STATUS_DEFAULT,
  KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
  KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
  KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS,
  KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_DEFAULT,
  KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_DEFAULT,
  KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER,
  KOREAN_FIELDWORK_SURVEY_BOUNDARY_TYPE_DEFAULT,
  NewDocument,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from '../korean-fieldwork-categories';
import {
  getKoreanFieldworkFeatureInterpretationTypeValue,
  getKoreanFieldworkFeatureTypeOption,
} from '../korean-fieldwork-feature-types';
import { type KoreanFieldworkInvestigationModeId } from '../korean-fieldwork-investigation-mode';

export const LAYER_SEQUENCE_MEANING_DEFAULT = KOREAN_FIELDWORK_LAYER_SEQUENCE_MEANING_DEFAULT;
export const SOIL_COLOR_ASSIST_STATUS_DEFAULT = KOREAN_FIELDWORK_SOIL_COLOR_ASSIST_STATUS_DEFAULT;
export const SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT = KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT;
export const SOIL_PROFILE_PHOTO_QUALITY_DEFAULT = KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_QUALITY_DEFAULT;
export const SURVEY_BOUNDARY_TYPE_DEFAULT = KOREAN_FIELDWORK_SURVEY_BOUNDARY_TYPE_DEFAULT;
export const SURVEY_BOUNDARY_SOURCE_DEFAULT = KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_DEFAULT;
export const SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER = KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER;
export const SURVEY_BOUNDARY_ACCURACY_DEFAULT = KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_DEFAULT;
export const SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS = KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS;
export const REFERENCE_BASEMAP_PROVIDER_DEFAULT = KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_DEFAULT;
export const REFERENCE_BASEMAP_PROVIDER_KAKAO_HYBRID = 'kakaoHybrid';
export const FEATURE_RECORDING_STATUS_CANDIDATE = KOREAN_FIELDWORK_FEATURE_RECORDING_STATUS_CANDIDATE;
export const GEOMETRY_SOURCE_GPS_APPROXIMATE = KOREAN_FIELDWORK_GEOMETRY_SOURCE_GPS_APPROXIMATE;
export const GEOMETRY_CONFIDENCE_ROUGH = KOREAN_FIELDWORK_GEOMETRY_CONFIDENCE_ROUGH;
export const FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH = KOREAN_FIELDWORK_FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH;
export const FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT = KOREAN_FIELDWORK_FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT;
export const GPS_DRAFT_BOUNDARY_HALF_SIZE_METERS = KOREAN_FIELDWORK_GPS_DRAFT_BOUNDARY_HALF_SIZE_METERS;

export type MapLocation = { x: number; y: number };

interface SurveyBoundaryDraftOptions {
  boundaryAccuracy?: string;
  boundarySource?: string;
  referenceBasemapProvider?: string;
}

interface OperationDraftOptions {
  legacyRootDocumentCount?: number;
  investigationModeId?: KoreanFieldworkInvestigationModeId;
  boundarySummary?: string;
  now?: Date;
}

export const createOperationDraft = (
  options: OperationDraftOptions = {}
): NewDocument => {
  const legacyRootDocumentCount = options.legacyRootDocumentCount ?? 0;
  const normalizedBoundarySummary = options.boundarySummary?.trim();
  const shortDescription = getOperationDraftShortDescription(
    legacyRootDocumentCount,
    normalizedBoundarySummary
  );
  const now = options.now ?? new Date(Date.now());

  return {
    resource: {
      identifier: `조사구역-${formatOperationDraftTimestamp(now)}`,
      category: KOREAN_FIELDWORK_CATEGORIES.OPERATION,
      relations: {},
      ...(options.investigationModeId ? {
        projectInvestigationMode: options.investigationModeId,
      } : {}),
      ...(normalizedBoundarySummary ? {
        projectBoundarySetupState: 'draftBoundary',
        projectBoundarySummary: normalizedBoundarySummary,
      } : {}),
      ...(shortDescription ? { shortDescription } : {}),
    },
  };
};

const getOperationDraftShortDescription = (
  legacyRootDocumentCount: number,
  boundarySummary?: string
): string | undefined => {
  if (boundarySummary && legacyRootDocumentCount > 0) {
    return `${boundarySummary} · 기존 기록 ${legacyRootDocumentCount}건 유지`;
  }

  if (boundarySummary) return boundarySummary;

  if (legacyRootDocumentCount > 0) {
    return `기존 기록 ${legacyRootDocumentCount}건을 유지하고 새 조사 경계 기준을 만들었습니다.`;
  }

  return undefined;
};

const formatOperationDraftTimestamp = (date: Date): string =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
  + `-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;

const pad2 = (value: number): string => value.toString().padStart(2, '0');

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
    soilColorAssistCandidates: '',
    soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
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
  const featureInterpretationTypeValue =
    getKoreanFieldworkFeatureInterpretationTypeValue(featureTypeOption?.value);

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
      ...(featureInterpretationTypeValue
        ? { featureInterpretationType: [featureInterpretationTypeValue] }
        : {}),
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
  location?: MapLocation,
  boundarySummary?: string,
  options: SurveyBoundaryDraftOptions = {}
): NewDocument => {
  const normalizedBoundarySummary = boundarySummary?.trim();

  return {
    resource: {
      identifier: `survey-boundary-${Date.now()}`,
      category: KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY,
      relations: createKoreanFieldworkChildRelations(parentDoc),
      ...(location ? {
        geometry: createGpsDraftBoundaryGeometry(location),
      } : {}),
      ...(normalizedBoundarySummary ? {
        shortDescription: normalizedBoundarySummary,
        surveyBoundaryNote: normalizedBoundarySummary,
      } : {}),
      surveyBoundaryType: SURVEY_BOUNDARY_TYPE_DEFAULT,
      surveyBoundarySource: options.boundarySource ?? (location
        ? SURVEY_BOUNDARY_SOURCE_GPS_WALKOVER
        : SURVEY_BOUNDARY_SOURCE_DEFAULT),
      surveyBoundaryAccuracy: options.boundaryAccuracy ?? (location
        ? SURVEY_BOUNDARY_ACCURACY_APPROXIMATE_GPS
        : SURVEY_BOUNDARY_ACCURACY_DEFAULT),
      referenceBasemapProvider: options.referenceBasemapProvider
        ?? REFERENCE_BASEMAP_PROVIDER_DEFAULT,
    },
  };
};

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
