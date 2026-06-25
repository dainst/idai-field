import {
    CategoryForm,
    NewResource
} from 'idai-field-core';


export interface KoreanFieldworkDraftPreset {
    id: string;
    label: string;
    detail: string;
    icon: string;
    categoryNames: readonly string[];
    updates: Readonly<Record<string, unknown>>;
}

export interface KoreanFieldworkAvailableDraftPreset extends KoreanFieldworkDraftPreset {
    updates: Record<string, unknown>;
    fieldNames: string[];
}

const FIELDWORK_RECORD_CATEGORIES = [
    'Operation',
    'Trench',
    'FeatureGroup',
    'Feature',
    'FeatureSegment',
    'Layer',
    'Survey',
    'SurveyBoundary',
    'Find',
    'FindCollection',
    'Sample',
    'Photo',
    'SoilProfilePhoto',
    'Drawing',
    'PenMemo',
    'DailyLog',
    'FieldRecordQualityReview'
] as const;

const FEATURE_RECORD_CATEGORIES = [
    'FeatureGroup',
    'Feature',
    'FeatureSegment'
] as const;

export const KOREAN_FIELDWORK_DRAFT_PRESETS: readonly KoreanFieldworkDraftPreset[] = [
    {
        id: 'field-start',
        label: '현장 착수',
        detail: '당일 기록으로 시작하고 현장 기록을 남김',
        icon: 'mdi-play-circle-outline',
        categoryNames: FIELDWORK_RECORD_CATEGORIES,
        updates: {
            recordCreationTiming: 'sameDayFieldRecord',
            fieldRecordQuality: ['immediateRecording']
        }
    },
    {
        id: 'needs-review',
        label: '기록 보완',
        detail: '추가 기록이 필요한 보완 메모',
        icon: 'mdi-alert-outline',
        categoryNames: FIELDWORK_RECORD_CATEGORIES,
        updates: {
            recordCreationTiming: 'duringFieldwork',
            fieldRecordQuality: ['correctionNeeded']
        }
    },
    {
        id: 'feature-candidate',
        label: '조사 전',
        detail: '유구 성격을 고르고 조사 전 사진부터',
        icon: 'mdi-lightbulb-outline',
        categoryNames: FEATURE_RECORD_CATEGORIES,
        updates: {
            featureRecordingStatus: 'candidate',
            recordCreationTiming: 'sameDayFieldRecord',
            fieldRecordQuality: ['immediateRecording'],
            featureInvestigationChecklist: ['preInvestigationPhotoTaken']
        }
    },
    {
        id: 'feature-investigation',
        label: '조사 중',
        detail: '사진과 실측을 이어갈 조사 중 상태',
        icon: 'mdi-hammer-wrench',
        categoryNames: FEATURE_RECORD_CATEGORIES,
        updates: {
            featureRecordingStatus: 'investigating',
            recordCreationTiming: 'duringFieldwork',
            fieldRecordQuality: ['immediateRecording'],
            verificationState: 'observedInField',
            featureInvestigationChecklist: [
                'preInvestigationPhotoTaken',
                'inProgressPhotoTaken'
            ]
        }
    },
    {
        id: 'feature-closeout',
        label: '완료',
        detail: '마감 사진, 실측, 유물 수습을 한 번에 확인',
        icon: 'mdi-check-decagram-outline',
        categoryNames: FEATURE_RECORD_CATEGORIES,
        updates: {
            featureRecordingStatus: 'confirmed',
            recordCreationTiming: 'sameDayFieldRecord',
            fieldRecordQuality: [
                'immediateRecording',
                'observationInterpretationSeparated'
            ],
            featureInvestigationChecklist: [
                'measuredDrawingCompleted',
                'findsRecovered',
                'completionPhotoTaken'
            ]
        }
    }
];


export function getKoreanFieldworkDraftPresets(
        category: CategoryForm|undefined,
        resource: NewResource
): KoreanFieldworkAvailableDraftPreset[] {

    const categoryFieldNames = getCategoryFieldNames(category);

    return KOREAN_FIELDWORK_DRAFT_PRESETS
        .filter(preset => preset.categoryNames.includes(resource.category))
        .map(preset => makeAvailablePreset(preset, categoryFieldNames))
        .filter((preset): preset is KoreanFieldworkAvailableDraftPreset => preset !== undefined);
}


function makeAvailablePreset(preset: KoreanFieldworkDraftPreset,
                             categoryFieldNames: Set<string>)
        : KoreanFieldworkAvailableDraftPreset|undefined {

    const updateEntries = Object.entries(preset.updates)
        .filter(([fieldName]) => categoryFieldNames.has(fieldName));

    if (updateEntries.length === 0) return undefined;

    return {
        ...preset,
        updates: Object.fromEntries(updateEntries),
        fieldNames: updateEntries.map(([fieldName]) => fieldName)
    };
}


function getCategoryFieldNames(category: CategoryForm|undefined): Set<string> {

    if (!category) return new Set();

    return new Set(category.groups.flatMap(group =>
        group.fields.map(field => field.name)
    ));
}
