import {
  Document,
  KOREAN_FIELDWORK_RECORD_CREATION_TIMING_DURING_FIELDWORK,
  NewResource,
  ProjectConfiguration,
  Resource,
} from 'idai-field-core';
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
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  getKoreanFieldworkFeatureInterpretationTypeValue,
  getKoreanFieldworkFeatureTypeOption,
} from './korean-fieldwork-feature-types';

const C = KOREAN_FIELDWORK_CATEGORIES;

const DRAFT_IDENTIFIER_PREFIXES: Readonly<Record<string, string>> = {
  [C.AERIAL_MAP_LAYER]: 'aerial-map-layer',
  [C.DAILY_LOG]: 'daily-log',
  [C.DRAWING]: 'drawing',
  [C.FEATURE]: 'feature',
  [C.FEATURE_GROUP]: 'feature-group',
  [C.FEATURE_SEGMENT]: 'feature-segment',
  [C.FIELD_RECORD_QUALITY_REVIEW]: 'field-record-review',
  [C.FIND]: 'find',
  [C.FIND_COLLECTION]: 'find-collection',
  [C.LAYER]: 'layer',
  [C.PEN_MEMO]: 'pen-memo',
  [C.PHOTO]: 'photo',
  [C.SAMPLE]: 'sample',
  [C.SOIL_PROFILE_PHOTO]: 'soil-profile-photo',
  [C.SOURCE_EVIDENCE_INDEX]: 'source-evidence-index',
  [C.SURVEY]: 'survey',
  [C.SURVEY_BOUNDARY]: 'survey-boundary',
  [C.TRENCH]: 'trench',
};

export interface KoreanFieldworkDraftResourceOptions {
  featureType?: string;
}

export const createKoreanFieldworkDraftResource = (
  parentDoc: Document,
  categoryName: string,
  config: ProjectConfiguration,
  options: KoreanFieldworkDraftResourceOptions = {}
): NewResource => {
  const featureTypeOption = categoryName === C.FEATURE
    ? getKoreanFieldworkFeatureTypeOption(options.featureType)
    : undefined;
  const resource: NewResource = {
    identifier: createDraftIdentifier(categoryName, featureTypeOption?.value),
    relations: createKoreanFieldworkDraftRelations(parentDoc, categoryName, config),
    category: categoryName,
  };

  if (isFeatureWorkflowCategory(categoryName)) {
    const featureInterpretationTypeValue = getKoreanFieldworkFeatureInterpretationTypeValue(
      featureTypeOption?.value
    );

    return {
      ...resource,
      ...(featureTypeOption ? { featureType: featureTypeOption.value } : {}),
      ...(featureInterpretationTypeValue
        ? { featureInterpretationType: [featureInterpretationTypeValue] }
        : {}),
      featureRecordingStatus: FEATURE_RECORDING_STATUS_CANDIDATE,
      featureGeometryEditStatus: FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
      featureGeometryRevisionHistory: FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
      featureInvestigationChecklist: [],
      featureSoilProfilePhotoCount: 0,
    };
  }

  if (categoryName === C.TRENCH) {
    return {
      ...resource,
      featureInvestigationChecklist: [],
      recordCreationTiming: KOREAN_FIELDWORK_RECORD_CREATION_TIMING_DURING_FIELDWORK,
      fieldRecordQuality: [],
    };
  }

  if (categoryName === C.LAYER) {
    return {
      ...resource,
      layerSequenceNumber: 1,
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
      soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
    };
  }

  if (categoryName === C.SOIL_PROFILE_PHOTO) {
    return {
      ...resource,
      soilProfileAnnotationStrokes: '[]',
      soilProfileLayerMarkers: '[]',
      soilProfileLayerIds: '[]',
      soilProfileColorSwatches: '[]',
      soilColorAssistCandidates: '',
      soilColorAssistStatus: SOIL_COLOR_ASSIST_STATUS_DEFAULT,
      soilProfilePhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
      soilProfilePhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
      layerSequenceMeaning: LAYER_SEQUENCE_MEANING_DEFAULT,
    };
  }

  if (categoryName === C.PHOTO) {
    return {
      ...resource,
      fieldworkPhotoSizeHintKb: SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
      fieldworkPhotoQuality: SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
      mediaEvidenceRole: ['fieldResultRecord'],
    };
  }

  if (categoryName === C.SURVEY_BOUNDARY) {
    return {
      ...resource,
      surveyBoundaryType: SURVEY_BOUNDARY_TYPE_DEFAULT,
      surveyBoundarySource: SURVEY_BOUNDARY_SOURCE_DEFAULT,
      surveyBoundaryAccuracy: SURVEY_BOUNDARY_ACCURACY_DEFAULT,
      referenceBasemapProvider: REFERENCE_BASEMAP_PROVIDER_DEFAULT,
    };
  }

  if (categoryName === C.PEN_MEMO) {
    return {
      ...resource,
      penMemoStrokes: '[]',
      penMemoTranscriptionStatus: 'pending',
    };
  }

  return resource;
};

export const createKoreanFieldworkDraftRelations = (
  parentDoc: Document,
  categoryName: string,
  config: ProjectConfiguration
): Resource.Relations => {
  const parentCategoryName = parentDoc.resource.category;
  const parentRecordedIn = parentDoc.resource.relations?.isRecordedIn?.[0];
  const isAllowedRelation = (relationName: string) =>
    config.isAllowedRelationDomainCategory(
      categoryName,
      parentCategoryName,
      relationName
    );

  if (
    categoryName === C.AERIAL_MAP_LAYER
    && isAllowedRelation('isMapLayerOf')
  ) {
    return { isMapLayerOf: [parentDoc.resource.id] };
  }

  if (isAllowedRelation('depicts')) {
    return { depicts: [parentDoc.resource.id] };
  }

  if (isAllowedRelation('liesWithin')) {
    const recordedInTarget = parentRecordedIn
      ?? (isAllowedRelation('isRecordedIn') ? parentDoc.resource.id : undefined);

    return {
      ...(recordedInTarget ? { isRecordedIn: [recordedInTarget] } : {}),
      liesWithin: [parentDoc.resource.id],
    };
  }

  if (isAllowedRelation('isRecordedIn')) {
    return { isRecordedIn: [parentDoc.resource.id] };
  }

  return parentRecordedIn
    ? { isRecordedIn: [parentRecordedIn], liesWithin: [parentDoc.resource.id] }
    : { isRecordedIn: [parentDoc.resource.id] };
};

export const createDraftIdentifier = (
  categoryName: string,
  featureType?: string
): string => {
  const featureTypeOption = categoryName === C.FEATURE
    ? getKoreanFieldworkFeatureTypeOption(featureType)
    : undefined;
  const prefix = featureTypeOption?.identifierPrefix
    ?? DRAFT_IDENTIFIER_PREFIXES[categoryName]
    ?? toKebabCase(categoryName);

  return `${prefix}-${Date.now()}`;
};

const isFeatureWorkflowCategory = (categoryName: string): boolean =>
  categoryName === C.FEATURE
  || categoryName === C.FEATURE_GROUP
  || categoryName === C.FEATURE_SEGMENT;

const toKebabCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
