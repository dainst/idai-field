import {
    CategoryForm,
    Document,
    NewResource,
    ProjectConfiguration,
    Resource
} from 'idai-field-core';
import { getKoreanFieldworkDefaultFieldValues } from './korean-fieldwork-draft-defaults';
import {
    KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS
} from './korean-fieldwork-feature-guidance';
import {
    KoreanFieldworkFieldNoteContinuationSeed,
    KoreanFieldworkFieldNoteInput
} from './korean-fieldwork-notebook-digest';


export interface KoreanFieldworkContinuationAction {
    id: string;
    categoryName: string;
    relationName: string;
}

export interface KoreanFieldworkDraftResourceOptions {
    boundaryAccuracy?: string;
    boundarySummary?: string;
    boundarySource?: string;
    featureType?: string;
    recordMemoContinuation?: KoreanFieldworkFieldNoteContinuationSeed;
    recordMemoTemplate?: boolean;
    referenceBasemapProvider?: string;
}

const CATEGORIES = {
    DAILY_LOG: 'DailyLog',
    DRAWING: 'Drawing',
    FEATURE: 'Feature',
    FEATURE_GROUP: 'FeatureGroup',
    FEATURE_SEGMENT: 'FeatureSegment',
    FIELD_RECORD_QUALITY_REVIEW: 'FieldRecordQualityReview',
    FIND: 'Find',
    FIND_COLLECTION: 'FindCollection',
    LAYER: 'Layer',
    PEN_MEMO: 'PenMemo',
    PHOTO: 'Photo',
    SAMPLE: 'Sample',
    SOIL_PROFILE_PHOTO: 'SoilProfilePhoto',
    SURVEY: 'Survey',
    SURVEY_BOUNDARY: 'SurveyBoundary',
    TRENCH: 'Trench',
    OPERATION: 'Operation'
};

const DRAFT_IDENTIFIER_PREFIXES: Readonly<Record<string, string>> = {
    [CATEGORIES.DAILY_LOG]: 'daily-log',
    [CATEGORIES.DRAWING]: 'drawing',
    [CATEGORIES.FEATURE]: 'feature',
    [CATEGORIES.FEATURE_GROUP]: 'feature-group',
    [CATEGORIES.FEATURE_SEGMENT]: 'feature-segment',
    [CATEGORIES.FIELD_RECORD_QUALITY_REVIEW]: 'field-record-review',
    [CATEGORIES.FIND]: 'find',
    [CATEGORIES.FIND_COLLECTION]: 'find-collection',
    [CATEGORIES.LAYER]: 'layer',
    [CATEGORIES.PEN_MEMO]: 'pen-memo',
    [CATEGORIES.PHOTO]: 'photo',
    [CATEGORIES.SAMPLE]: 'sample',
    [CATEGORIES.SOIL_PROFILE_PHOTO]: 'soil-profile-photo',
    [CATEGORIES.SURVEY]: 'survey',
    [CATEGORIES.SURVEY_BOUNDARY]: 'survey-boundary',
    [CATEGORIES.TRENCH]: 'trench'
};

const FEATURE_TYPE_IDENTIFIER_PREFIXES: Readonly<Record<string, string>> = {
    burial: '토광묘',
    building: '건물지',
    ditch: '구상유구',
    dwelling: '주거지',
    fence: '목책열',
    kiln: '가마',
    pit: '수혈',
    posthole: '주혈',
    production: '생산유구',
    unknown: '유구'
};

const CONTINUATION_CATEGORIES = new Set<string>([
    CATEGORIES.OPERATION,
    CATEGORIES.TRENCH,
    CATEGORIES.FEATURE_GROUP,
    CATEGORIES.FEATURE,
    CATEGORIES.FEATURE_SEGMENT,
    CATEGORIES.LAYER,
    CATEGORIES.SURVEY,
    CATEGORIES.SURVEY_BOUNDARY,
    CATEGORIES.FIND,
    CATEGORIES.FIND_COLLECTION,
    CATEGORIES.SAMPLE,
    CATEGORIES.PHOTO,
    CATEGORIES.SOIL_PROFILE_PHOTO,
    CATEGORIES.DRAWING,
    CATEGORIES.PEN_MEMO,
    CATEGORIES.DAILY_LOG,
    CATEGORIES.FIELD_RECORD_QUALITY_REVIEW
]);

const NEXT_CHILD_CATEGORY: Readonly<Record<string, string|undefined>> = {
    [CATEGORIES.OPERATION]: CATEGORIES.TRENCH,
    [CATEGORIES.TRENCH]: CATEGORIES.FEATURE,
    [CATEGORIES.FEATURE_GROUP]: CATEGORIES.FEATURE,
    [CATEGORIES.FEATURE]: CATEGORIES.FEATURE_SEGMENT,
    [CATEGORIES.FEATURE_SEGMENT]: CATEGORIES.LAYER
};

const EVIDENCE_CATEGORY_PRIORITY: Readonly<Record<string, readonly string[]>> = {
    [CATEGORIES.OPERATION]: [CATEGORIES.SURVEY_BOUNDARY, CATEGORIES.DAILY_LOG, CATEGORIES.PEN_MEMO],
    [CATEGORIES.TRENCH]: [
        CATEGORIES.PHOTO,
        CATEGORIES.DRAWING,
        CATEGORIES.SOIL_PROFILE_PHOTO,
        CATEGORIES.PEN_MEMO
    ],
    [CATEGORIES.FEATURE_GROUP]: [CATEGORIES.PHOTO, CATEGORIES.DRAWING, CATEGORIES.PEN_MEMO],
    [CATEGORIES.FEATURE]: [
        CATEGORIES.PHOTO,
        CATEGORIES.SOIL_PROFILE_PHOTO,
        CATEGORIES.DRAWING,
        CATEGORIES.PEN_MEMO,
        CATEGORIES.FIND,
        CATEGORIES.SAMPLE
    ],
    [CATEGORIES.FEATURE_SEGMENT]: [
        CATEGORIES.PHOTO,
        CATEGORIES.SOIL_PROFILE_PHOTO,
        CATEGORIES.DRAWING,
        CATEGORIES.PEN_MEMO,
        CATEGORIES.FIND,
        CATEGORIES.SAMPLE
    ],
    [CATEGORIES.LAYER]: [
        CATEGORIES.SOIL_PROFILE_PHOTO,
        CATEGORIES.SAMPLE,
        CATEGORIES.PHOTO,
        CATEGORIES.DRAWING,
        CATEGORIES.PEN_MEMO
    ],
    [CATEGORIES.SURVEY]: [
        CATEGORIES.SURVEY_BOUNDARY,
        CATEGORIES.FIND_COLLECTION,
        CATEGORIES.FIND,
        CATEGORIES.PHOTO,
        CATEGORIES.PEN_MEMO
    ],
    [CATEGORIES.FIND_COLLECTION]: [CATEGORIES.FIND, CATEGORIES.PHOTO, CATEGORIES.PEN_MEMO],
    [CATEGORIES.FIND]: [CATEGORIES.PHOTO, CATEGORIES.DRAWING, CATEGORIES.SAMPLE, CATEGORIES.PEN_MEMO],
    [CATEGORIES.SAMPLE]: [CATEGORIES.PHOTO, CATEGORIES.PEN_MEMO]
};

const RELATION_LABEL_ORDER = ['liesWithin', 'depicts', 'isRecordedIn', 'isMapLayerOf'];


export function getKoreanFieldworkContinuationActions(
        parentDoc: Document,
        projectConfiguration: ProjectConfiguration
): KoreanFieldworkContinuationAction[] {

    const parentCategoryName = parentDoc?.resource?.category;
    if (!parentDoc?.resource?.id || !CONTINUATION_CATEGORIES.has(parentCategoryName)) return [];

    const candidateCategoryNames = dedupe([
        NEXT_CHILD_CATEGORY[parentCategoryName],
        ...(EVIDENCE_CATEGORY_PRIORITY[parentCategoryName] ?? [])
    ].filter((categoryName): categoryName is string => !!categoryName));

    return candidateCategoryNames
        .map(categoryName => makeContinuationAction(categoryName, parentDoc, projectConfiguration))
        .filter((action): action is KoreanFieldworkContinuationAction => action !== undefined)
        .slice(0, 5);
}


export function createKoreanFieldworkDraftResource(
        parentDoc: Document,
        categoryName: string,
        projectConfiguration: ProjectConfiguration,
        options: KoreanFieldworkDraftResourceOptions = {}
): NewResource {

    const category = getCategory(categoryName, projectConfiguration);
    const featurePreset = categoryName === CATEGORIES.FEATURE
        ? getFeatureGuidancePreset(options.featureType ?? 'unknown')
        : undefined;

    return {
        identifier: createDraftIdentifier(categoryName, featurePreset?.featureType),
        relations: createKoreanFieldworkDraftRelations(parentDoc, categoryName, projectConfiguration),
        category: categoryName,
        ...getKoreanFieldworkDefaultFieldValues(category, {
            boundaryAccuracy: options.boundaryAccuracy,
            boundarySummary: options.boundarySummary,
            boundarySource: options.boundarySource,
            referenceBasemapProvider: options.referenceBasemapProvider
        }),
        ...getFeatureGuidanceDraftValues(category, featurePreset),
        ...getRecordMemoDraftValues(
            category,
            parentDoc,
            options.recordMemoTemplate,
            options.recordMemoContinuation
        )
    };
}


export function createKoreanFieldworkDraftRelations(
        parentDoc: Document,
        categoryName: string,
        projectConfiguration: ProjectConfiguration
): Resource.Relations {

    const parentCategoryName = parentDoc.resource.category;
    const parentRecordedIn = parentDoc.resource.relations?.isRecordedIn?.[0];
    const isAllowedRelation = (relationName: string) =>
        projectConfiguration.isAllowedRelationDomainCategory(
            categoryName,
            parentCategoryName,
            relationName
        );

    if (isAllowedRelation('isMapLayerOf')) return { isMapLayerOf: [parentDoc.resource.id] };
    if (isAllowedRelation('depicts')) return { depicts: [parentDoc.resource.id] };

    if (isAllowedRelation('liesWithin')) {
        const recordedInTarget = parentRecordedIn
            ?? (isAllowedRelation('isRecordedIn') ? parentDoc.resource.id : undefined);

        return {
            ...(recordedInTarget ? { isRecordedIn: [recordedInTarget] } : {}),
            liesWithin: [parentDoc.resource.id]
        };
    }

    if (isAllowedRelation('isRecordedIn')) return { isRecordedIn: [parentDoc.resource.id] };

    return parentRecordedIn
        ? { isRecordedIn: [parentRecordedIn], liesWithin: [parentDoc.resource.id] }
        : { isRecordedIn: [parentDoc.resource.id] };
}


export function canCreateKoreanFieldworkChildRecord(
        category: CategoryForm,
        parentDoc: Document,
        projectConfiguration: ProjectConfiguration
): boolean {

    if (!category || category.name === 'Image') return false;

    const canUseRelation = (relationName: string) =>
        projectConfiguration.isAllowedRelationDomainCategory(
            category.name,
            parentDoc.resource.category,
            relationName
        );

    return (
        (canUseRelation('isRecordedIn') && !category.mustLieWithin)
        || canUseRelation('liesWithin')
        || canUseRelation('depicts')
        || canUseRelation('isMapLayerOf')
    );
}


export function createDraftIdentifier(categoryName: string, featureType?: string): string {

    const prefix = categoryName === CATEGORIES.FEATURE && featureType
        ? FEATURE_TYPE_IDENTIFIER_PREFIXES[featureType] ?? DRAFT_IDENTIFIER_PREFIXES[categoryName]
        : DRAFT_IDENTIFIER_PREFIXES[categoryName] ?? toKebabCase(categoryName);

    return `${prefix}-${Date.now()}`;
}


function makeContinuationAction(categoryName: string,
                                parentDoc: Document,
                                projectConfiguration: ProjectConfiguration)
        : KoreanFieldworkContinuationAction|undefined {

    const category = getCategory(categoryName, projectConfiguration);
    if (!category || !canCreateKoreanFieldworkChildRecord(category, parentDoc, projectConfiguration)) {
        return undefined;
    }

    const relationName = getPreferredRelationName(categoryName, parentDoc, projectConfiguration);
    if (!relationName) return undefined;

    return {
        id: `${categoryName}:${relationName}`,
        categoryName,
        relationName
    };
}


function getPreferredRelationName(categoryName: string,
                                  parentDoc: Document,
                                  projectConfiguration: ProjectConfiguration): string|undefined {

    return RELATION_LABEL_ORDER.find(relationName =>
        projectConfiguration.isAllowedRelationDomainCategory(
            categoryName,
            parentDoc.resource.category,
            relationName
        )
    );
}


function getCategory(categoryName: string, projectConfiguration: ProjectConfiguration): CategoryForm|undefined {

    try {
        return projectConfiguration.getCategory(categoryName);
    } catch (_) {
        return undefined;
    }
}


function getFeatureGuidancePreset(featureType: string|undefined) {

    return KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS.find(preset => preset.featureType === featureType);
}


function getFeatureGuidanceDraftValues(
        category: CategoryForm|undefined,
        preset: typeof KOREAN_FIELDWORK_FEATURE_GUIDANCE_PRESETS[number]|undefined) {

    if (!category || !preset) return {};

    return {
        ...(CategoryForm.getField(category, 'featureType') ? { featureType: preset.featureType } : {}),
        ...(preset.interpretationValue && CategoryForm.getField(category, 'featureInterpretationType')
            ? { featureInterpretationType: [preset.interpretationValue] }
            : {})
    };
}


function getRecordMemoDraftValues(
        category: CategoryForm|undefined,
        parentDoc: Document,
        useTemplate: boolean|undefined,
        continuation: KoreanFieldworkFieldNoteContinuationSeed|undefined) {

    if ((!useTemplate && !continuation) || category?.name !== CATEGORIES.PEN_MEMO) return {};

    const parentLabel = parentDoc.resource.identifier || parentDoc.resource.id || '선택 기록';
    const sourceLabel = continuation?.sourceLabel;

    return {
        ...(CategoryForm.getField(category, 'shortDescription')
            ? { shortDescription: sourceLabel ? `${parentLabel} ${sourceLabel}` : `${parentLabel} 현장 메모` }
            : {}),
        ...(CategoryForm.getField(category, 'description')
            ? { description: makeRecordMemoTemplate(continuation?.input) }
            : {})
    };
}


function makeRecordMemoTemplate(input: KoreanFieldworkFieldNoteInput|undefined): string {

    return [
        makeFieldNoteSectionLine('관찰 내용', input?.observation),
        makeFieldNoteSectionLine('스케치·약측/근거 번호', input?.evidenceNumbers),
        makeFieldNoteSectionLine('다음 작업', input?.nextWork),
        ...(input?.interpretation ? [makeFieldNoteSectionLine('해석', input.interpretation)] : [])
    ].join('\n\n');
}


function makeFieldNoteSectionLine(label: string, value: string|undefined): string {

    return `[${label}]${value ? ` ${value}` : ''}`;
}


function dedupe<T>(values: T[]): T[] {

    return values.filter((value, index) => values.indexOf(value) === index);
}


function toKebabCase(value: string): string {

    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}
