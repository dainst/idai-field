import {
    CategoryForm,
    FieldGeometryType,
    KOREAN_FIELDWORK_FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
    KOREAN_FIELDWORK_FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
    KOREAN_FIELDWORK_FEATURE_RECORDING_STATUS_CANDIDATE,
    KOREAN_FIELDWORK_GEOMETRY_CONFIDENCE_ROUGH,
    KOREAN_FIELDWORK_GEOMETRY_SOURCE_TABLET_SKETCH,
    KOREAN_FIELDWORK_LAYER_SEQUENCE_MEANING_DEFAULT,
    KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_DEFAULT,
    KOREAN_FIELDWORK_RECORD_CREATION_TIMING_DURING_FIELDWORK,
    KOREAN_FIELDWORK_SOIL_COLOR_ASSIST_STATUS_DEFAULT,
    KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
    KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
    KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_DEFAULT,
    KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_DEFAULT,
    KOREAN_FIELDWORK_SURVEY_BOUNDARY_TYPE_DEFAULT
} from 'idai-field-core';
import { Map } from 'tsfun';


const FEATURE_WORKFLOW_CATEGORIES = ['Feature', 'FeatureGroup', 'FeatureSegment'];
const LAYER_CATEGORY = 'Layer';
const PEN_MEMO_CATEGORY = 'PenMemo';
const PHOTO_CATEGORY = 'Photo';
const SOIL_PROFILE_PHOTO_CATEGORY = 'SoilProfilePhoto';
const SURVEY_BOUNDARY_CATEGORY = 'SurveyBoundary';
const TRENCH_CATEGORY = 'Trench';

export interface KoreanFieldworkDefaultFieldOptions {
    boundaryAccuracy?: string;
    boundarySummary?: string;
    boundarySource?: string;
    geometryType?: FieldGeometryType|string;
    referenceBasemapProvider?: string;
}


export function getKoreanFieldworkDefaultFieldValues(category: CategoryForm|undefined,
                                                     options: KoreanFieldworkDefaultFieldOptions = {}): Map<any> {

    if (!category) return {};

    if (isKoreanFieldworkFeatureCategory(category)) {
        return getConfiguredDefaults(category, {
            featureRecordingStatus: KOREAN_FIELDWORK_FEATURE_RECORDING_STATUS_CANDIDATE,
            featureGeometryEditStatus: KOREAN_FIELDWORK_FEATURE_GEOMETRY_EDIT_STATUS_ROUGH_SKETCH,
            featureGeometryRevisionHistory: KOREAN_FIELDWORK_FEATURE_GEOMETRY_REVISION_HISTORY_DEFAULT,
            featureInvestigationChecklist: [],
            featureSoilProfilePhotoCount: 0,
            ...(options.geometryType && options.geometryType !== 'none'
                ? {
                    geometrySource: KOREAN_FIELDWORK_GEOMETRY_SOURCE_TABLET_SKETCH,
                    geometryConfidence: KOREAN_FIELDWORK_GEOMETRY_CONFIDENCE_ROUGH
                }
                : {})
        });
    }

    if (isKoreanFieldworkTrenchCategory(category)) {
        return getConfiguredDefaults(category, {
            featureInvestigationChecklist: [],
            fieldRecordQuality: [],
            recordCreationTiming: KOREAN_FIELDWORK_RECORD_CREATION_TIMING_DURING_FIELDWORK
        });
    }

    if (isKoreanFieldworkLayerCategory(category)) {
        return getConfiguredDefaults(category, {
            layerSequenceNumber: 1,
            layerSequenceMeaning: KOREAN_FIELDWORK_LAYER_SEQUENCE_MEANING_DEFAULT,
            soilColorAssistStatus: KOREAN_FIELDWORK_SOIL_COLOR_ASSIST_STATUS_DEFAULT
        });
    }

    if (isKoreanFieldworkSoilProfilePhotoCategory(category)) {
        return getConfiguredDefaults(category, {
            layerSequenceMeaning: KOREAN_FIELDWORK_LAYER_SEQUENCE_MEANING_DEFAULT,
            soilColorAssistCandidates: '',
            soilColorAssistStatus: KOREAN_FIELDWORK_SOIL_COLOR_ASSIST_STATUS_DEFAULT,
            soilProfileAnnotationStrokes: '[]',
            soilProfileColorSwatches: '[]',
            soilProfileLayerIds: '[]',
            soilProfileLayerMarkers: '[]',
            soilProfilePhotoQuality: KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
            soilProfilePhotoSizeHintKb: KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT
        });
    }

    if (isKoreanFieldworkPhotoCategory(category)) {
        return getConfiguredDefaults(category, {
            fieldworkPhotoQuality: KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_QUALITY_DEFAULT,
            fieldworkPhotoSizeHintKb: KOREAN_FIELDWORK_SOIL_PROFILE_PHOTO_SIZE_HINT_KB_DEFAULT,
            mediaEvidenceRole: ['fieldResultRecord']
        });
    }

    if (isKoreanFieldworkSurveyBoundaryCategory(category)) {
        const boundarySummary = options.boundarySummary?.trim();

        return getConfiguredDefaults(category, {
            ...(boundarySummary
                ? {
                    shortDescription: boundarySummary,
                    surveyBoundaryNote: boundarySummary
                }
                : {}),
            referenceBasemapProvider: options.referenceBasemapProvider
                ?? KOREAN_FIELDWORK_REFERENCE_BASEMAP_PROVIDER_DEFAULT,
            surveyBoundaryAccuracy: options.boundaryAccuracy
                ?? KOREAN_FIELDWORK_SURVEY_BOUNDARY_ACCURACY_DEFAULT,
            surveyBoundarySource: options.boundarySource
                ?? KOREAN_FIELDWORK_SURVEY_BOUNDARY_SOURCE_DEFAULT,
            surveyBoundaryType: KOREAN_FIELDWORK_SURVEY_BOUNDARY_TYPE_DEFAULT
        });
    }

    if (isKoreanFieldworkPenMemoCategory(category)) {
        return getConfiguredDefaults(category, {
            penMemoStrokes: '[]',
            penMemoTranscriptionStatus: 'pending'
        });
    }

    return {};
}


export function isKoreanFieldworkFeatureCategory(category: CategoryForm|undefined): boolean {

    if (!category || !FEATURE_WORKFLOW_CATEGORIES.includes(category.name)) return false;

    return hasValuelist(category, 'featureRecordingStatus', 'KoreanFieldwork-featureRecordingStatus');
}


function isKoreanFieldworkTrenchCategory(category: CategoryForm): boolean {

    return category.name === TRENCH_CATEGORY
        && hasValuelist(category, 'recordCreationTiming', 'KoreanFieldwork-recordCreationTiming');
}


function isKoreanFieldworkLayerCategory(category: CategoryForm): boolean {

    return category.name === LAYER_CATEGORY
        && hasValuelist(category, 'layerSequenceMeaning', 'KoreanFieldwork-layerSequenceMeaning');
}


function isKoreanFieldworkSoilProfilePhotoCategory(category: CategoryForm): boolean {

    return category.name === SOIL_PROFILE_PHOTO_CATEGORY
        && hasValuelist(category, 'layerSequenceMeaning', 'KoreanFieldwork-layerSequenceMeaning');
}


function isKoreanFieldworkPhotoCategory(category: CategoryForm): boolean {

    return category.name === PHOTO_CATEGORY
        && !!CategoryForm.getField(category, 'mediaEvidenceRole');
}


function isKoreanFieldworkSurveyBoundaryCategory(category: CategoryForm): boolean {

    return category.name === SURVEY_BOUNDARY_CATEGORY
        && hasValuelist(category, 'surveyBoundaryType', 'KoreanFieldwork-surveyBoundaryType');
}


function isKoreanFieldworkPenMemoCategory(category: CategoryForm): boolean {

    return category.name === PEN_MEMO_CATEGORY
        && !!CategoryForm.getField(category, 'penMemoTranscriptionStatus');
}


function getConfiguredDefaults(category: CategoryForm, defaults: Map<any>): Map<any> {

    return Object.entries(defaults).reduce((result: Map<any>, [fieldName, value]) => {
        if (CategoryForm.getField(category, fieldName)) result[fieldName] = value;
        return result;
    }, {});
}


function hasValuelist(category: CategoryForm, fieldName: string, valuelistId: string): boolean {

    return CategoryForm.getField(category, fieldName)?.valuelist?.id === valuelistId;
}
