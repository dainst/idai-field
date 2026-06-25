import { Condition, Document, Field } from 'idai-field-core';


export type KoreanFieldworkNarrativeField = 'shortDescription'|'description'|'interpretation';

export interface KoreanFieldworkNarrativeSnippet {
    id: string;
    label: string;
    detail: string;
    icon: string;
    target: KoreanFieldworkNarrativeField;
    text: string;
    mode: 'replace'|'append';
    categoryNames?: readonly string[];
}

export interface KoreanFieldworkNarrativeFieldGroup {
    fieldName: KoreanFieldworkNarrativeField;
    label: string;
    snippets: KoreanFieldworkNarrativeSnippet[];
}

export interface KoreanFieldworkNarrativeChecklistItem {
    id: 'observation'|'interpretation'|'evidenceNumbers';
    label: string;
    detail: string;
    isComplete: boolean;
}

const FEATURE_WORKFLOW_CATEGORIES = ['Feature', 'FeatureGroup', 'FeatureSegment'];

const FIELDWORK_NARRATIVE_CATEGORIES = new Set<string>([
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
]);

const FIELD_LABELS: Readonly<Record<KoreanFieldworkNarrativeField, string>> = {
    shortDescription: '짧은 설명',
    description: '설명',
    interpretation: '해석'
};

const FIELD_ORDER: readonly KoreanFieldworkNarrativeField[] = [
    'shortDescription',
    'description',
    'interpretation'
];

const NARRATIVE_SNIPPETS: readonly KoreanFieldworkNarrativeSnippet[] = [
    {
        id: 'common-field-checked',
        label: '현장 확인',
        detail: '현장 관찰 기준',
        icon: 'mdi-check-decagram-outline',
        target: 'shortDescription',
        text: '현장에서 관찰한 내용을 기준으로 기록함.',
        mode: 'replace'
    },
    {
        id: 'common-context-description',
        label: '위치·상태',
        detail: '위치, 범위, 관계',
        icon: 'mdi-note-text-outline',
        target: 'description',
        text: '위치, 범위, 보존 상태, 주변 기록과의 관계를 현장에서 확인함.',
        mode: 'append'
    },
    {
        id: 'common-interpretation-hold',
        label: '해석 메모',
        detail: '관찰과 해석 구분',
        icon: 'mdi-head-lightbulb-outline',
        target: 'interpretation',
        text: '현장 관찰 내용과 해석을 구분하고, 사진·도면·층위 관계 확인 사항을 함께 남김.',
        mode: 'append'
    },
    {
        id: 'operation-work-scope',
        label: '조사범위',
        detail: '범위와 기준점',
        icon: 'mdi-select-all',
        target: 'description',
        text: '조사 경계의 범위, 기준점, 접근 조건을 확인하고 기록할 구역을 구분함.',
        mode: 'append',
        categoryNames: ['Operation', 'SurveyBoundary']
    },
    {
        id: 'trench-position',
        label: '트렌치 위치',
        detail: '방향과 범위',
        icon: 'mdi-ruler-square',
        target: 'description',
        text: '트렌치의 위치, 방향, 조사 범위와 주변 유구 노출 양상을 함께 확인함.',
        mode: 'append',
        categoryNames: ['Trench']
    },
    {
        id: 'feature-group-relation',
        label: '군집 관계',
        detail: '배치와 중복',
        icon: 'mdi-vector-combine',
        target: 'description',
        text: '유구의 배치, 중복, 방향성을 기준으로 군집 내부 관계를 구분하여 기록함.',
        mode: 'append',
        categoryNames: ['FeatureGroup']
    },
    {
        id: 'feature-candidate-summary',
        label: '조사 전',
        detail: '경계 확인',
        icon: 'mdi-lightbulb-on-outline',
        target: 'shortDescription',
        text: '유구의 경계와 충전토를 확인 중임.',
        mode: 'replace',
        categoryNames: FEATURE_WORKFLOW_CATEGORIES
    },
    {
        id: 'feature-exposure',
        label: '노출 상태',
        detail: '경계와 교란',
        icon: 'mdi-eye-outline',
        target: 'description',
        text: '평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.',
        mode: 'append',
        categoryNames: FEATURE_WORKFLOW_CATEGORIES
    },
    {
        id: 'feature-field-note-flow',
        label: '유구 야장',
        detail: '그림·약측·근거',
        icon: 'mdi-notebook-edit-outline',
        target: 'description',
        text: '[관찰 내용] 유구 성격을 확정하지 말고 평면 형태, 규모, 내부 퇴적, 중복 관계를 확인.\n[스케치·약측] 약도/평면/단면 스케치 번호, 장축×단축, 깊이, 단면 위치를 적음.\n[사진·도면 번호] 사진 번호와 도면 번호를 서로 대조.\n[유구 성격] 미정/추정으로 둘 수 있으며, 유구명은 관찰·그림·사진 근거가 모이면 보완.\n[다음 작업] 단면 정리, 사진 보강, 실측, 유물·시료 수습 여부 확인.',
        mode: 'append',
        categoryNames: FEATURE_WORKFLOW_CATEGORIES
    },
    {
        id: 'feature-sketch-measure-evidence',
        label: '스케치·약측',
        detail: '그림과 설명 연결',
        icon: 'mdi-ruler-square',
        target: 'description',
        text: '[스케치·약측] 약도/평면/단면 스케치 번호, 측정 기준선, 장축×단축, 깊이, 촬영·도면 번호, 설명에서 참조할 부분을 함께 기록.',
        mode: 'append',
        categoryNames: FEATURE_WORKFLOW_CATEGORIES
    },
    {
        id: 'feature-shape-scale',
        label: '형태·규모',
        detail: '장축, 단축, 단면',
        icon: 'mdi-drawing',
        target: 'description',
        text: '장축·단축 방향, 평면 형태, 단면 형상을 구분하여 기록함.',
        mode: 'append',
        categoryNames: FEATURE_WORKFLOW_CATEGORIES
    },
    {
        id: 'layer-boundary',
        label: '토층 경계',
        detail: '색조와 포함물',
        icon: 'mdi-layers-outline',
        target: 'description',
        text: '상·하부 경계, 색조, 입도, 포함물을 기준으로 토층을 구분함.',
        mode: 'append',
        categoryNames: ['Layer']
    },
    {
        id: 'layer-field-note-color',
        label: '번호·토색',
        detail: '사진 표시 번호별',
        icon: 'mdi-format-list-numbered',
        target: 'description',
        text: '[관찰 내용] 사진 위 표시 번호별 토색을 기록. 예: 1 회갈색 사질토, 2 암갈색 점질토.\n[다음 작업] 사진 주석 번호와 토색 메모가 서로 맞는지 확인.',
        mode: 'append',
        categoryNames: ['Layer']
    },
    {
        id: 'layer-sequence',
        label: '토층 관계',
        detail: '선후관계 확인',
        icon: 'mdi-family-tree',
        target: 'interpretation',
        text: '인접 토층과의 선후관계는 단면 사진과 도면을 함께 대조하여 기록함.',
        mode: 'append',
        categoryNames: ['Layer']
    },
    {
        id: 'photo-context',
        label: '기록사진',
        detail: '대상과 방향',
        icon: 'mdi-camera-outline',
        target: 'shortDescription',
        text: '현장 관찰 근거 확인용 사진.',
        mode: 'replace',
        categoryNames: ['Photo']
    },
    {
        id: 'photo-quality-note',
        label: '촬영 조건',
        detail: '대상, 축척, 방향',
        icon: 'mdi-image-filter-center-focus',
        target: 'description',
        text: '대상, 방향, 축척, 촬영 위치가 식별되도록 촬영함.',
        mode: 'append',
        categoryNames: ['Photo', 'SoilProfilePhoto']
    },
    {
        id: 'soil-profile-photo-context',
        label: '토층사진',
        detail: '단면과 경계',
        icon: 'mdi-terrain',
        target: 'shortDescription',
        text: '토층 단면과 경계 확인용 사진.',
        mode: 'replace',
        categoryNames: ['SoilProfilePhoto']
    },
    {
        id: 'soil-profile-photo-field-note-color',
        label: '사진·토색',
        detail: '번호와 촬영 방향',
        icon: 'mdi-format-list-numbered',
        target: 'description',
        text: '[관찰 내용] 사진 위 표시 번호별 토색을 기록. 예: 1 회갈색 사질토, 2 암갈색 점질토.\n[다음 작업] 누락된 번호, 토색, 촬영 방향을 확인.',
        mode: 'append',
        categoryNames: ['SoilProfilePhoto']
    },
    {
        id: 'drawing-context',
        label: '실측도',
        detail: '현장 보정',
        icon: 'mdi-pencil-ruler',
        target: 'shortDescription',
        text: '현장 실측 및 보정 확인용 도면.',
        mode: 'replace',
        categoryNames: ['Drawing']
    },
    {
        id: 'find-context',
        label: '출토맥락',
        detail: '위치와 층위',
        icon: 'mdi-archive-search-outline',
        target: 'description',
        text: '출토 위치, 관련 층위, 수습 상태를 구분하여 기록함.',
        mode: 'append',
        categoryNames: ['Find', 'FindCollection']
    },
    {
        id: 'find-field-note-context',
        label: '출토맥락',
        detail: '관찰·번호',
        icon: 'mdi-package-variant-closed-check',
        target: 'description',
        text: '[관찰 내용] 출토 위치, 층위, 주변 유구와의 관계를 확인.\n[다음 작업] 수습 번호, 봉투·상자 표기, 사진 여부를 기록.',
        mode: 'append',
        categoryNames: ['Find', 'FindCollection']
    },
    {
        id: 'sample-context',
        label: '시료맥락',
        detail: '채취 기준',
        icon: 'mdi-flask-outline',
        target: 'description',
        text: '시료 채취 위치, 목적, 주변 퇴적 상태와 오염 가능성을 함께 기록함.',
        mode: 'append',
        categoryNames: ['Sample']
    },
    {
        id: 'sample-field-note-context',
        label: '채취맥락',
        detail: '목적·오염',
        icon: 'mdi-flask-check-outline',
        target: 'description',
        text: '[관찰 내용] 시료 채취 위치, 목적, 주변 퇴적 상태와 오염 가능성을 확인.\n[다음 작업] 시료 번호, 용기 표기, 분석 목적을 기록.',
        mode: 'append',
        categoryNames: ['Sample']
    }
];


export function getKoreanFieldworkNarrativeFieldGroups(
        document: Document|undefined,
        fieldDefinitions: Field[]|undefined
): KoreanFieldworkNarrativeFieldGroup[] {

    if (!document?.resource || !FIELDWORK_NARRATIVE_CATEGORIES.has(document.resource.category)) return [];

    const snippets = getKoreanFieldworkNarrativeSnippets(document, fieldDefinitions);

    return FIELD_ORDER
        .filter(fieldName => isEditableTextField(fieldName, document, fieldDefinitions))
        .map(fieldName => ({
            fieldName,
            label: FIELD_LABELS[fieldName],
            snippets: snippets.filter(snippet => snippet.target === fieldName)
        }))
        .filter(group => group.snippets.length > 0);
}


export function getKoreanFieldworkNarrativeSnippetValue(
        document: Document,
        snippet: KoreanFieldworkNarrativeSnippet
): string {

    if (snippet.mode === 'replace') return snippet.text;

    return appendNarrativeText(getStringResourceFieldValue(document, snippet.target), snippet.text);
}


export function getKoreanFieldworkNarrativeChecklistItems(
        document: Document|undefined,
        fieldDefinitions: Field[]|undefined
): KoreanFieldworkNarrativeChecklistItem[] {

    if (!document?.resource || !FIELDWORK_NARRATIVE_CATEGORIES.has(document.resource.category)) return [];

    const items: KoreanFieldworkNarrativeChecklistItem[] = [];
    const descriptionFields = ['description', 'shortDescription']
        .filter(fieldName => isEditableTextField(fieldName, document, fieldDefinitions));
    const hasObservation = descriptionFields.some(fieldName =>
        getStringResourceFieldValue(document, fieldName).trim().length > 0
    );

    if (descriptionFields.length > 0) {
        items.push({
            id: 'observation',
            label: '관찰',
            detail: '형태·상태·위치',
            isComplete: hasObservation
        });
    }

    if (isEditableTextField('interpretation', document, fieldDefinitions)) {
        items.push({
            id: 'interpretation',
            label: '해석',
            detail: '추정은 따로',
            isComplete: getStringResourceFieldValue(document, 'interpretation').trim().length > 0
        });
    }

    if (shouldTrackEvidenceNumbers(document)) {
        const combinedText = [
            'shortDescription',
            'description',
            'interpretation'
        ].map(fieldName => getStringResourceFieldValue(document, fieldName)).join('\n');

        items.push({
            id: 'evidenceNumbers',
            label: '번호',
            detail: '사진·도면·유물·시료',
            isComplete: hasEvidenceNumberText(combinedText)
        });
    }

    return items;
}


function getKoreanFieldworkNarrativeSnippets(
        document: Document,
        fieldDefinitions: Field[]|undefined
): KoreanFieldworkNarrativeSnippet[] {

    return NARRATIVE_SNIPPETS
        .filter(snippet => isEditableTextField(snippet.target, document, fieldDefinitions))
        .filter(snippet => isSnippetAvailableForCategory(snippet, document.resource.category));
}


function isEditableTextField(fieldName: string, document: Document, fieldDefinitions: Field[]|undefined): boolean {

    const field = fieldDefinitions?.find(candidate => candidate.name === fieldName);

    return !!field
        && field.editable === true
        && ['input', 'textarea', 'text'].includes(field.inputType)
        && Condition.isFulfilled(field.condition, document.resource, fieldDefinitions, 'field');
}


function isSnippetAvailableForCategory(snippet: KoreanFieldworkNarrativeSnippet, categoryName: string): boolean {

    return !snippet.categoryNames || snippet.categoryNames.includes(categoryName);
}


function appendNarrativeText(currentValue: string, snippetText: string): string {

    const trimmedCurrentValue = currentValue.trimEnd();

    if (trimmedCurrentValue.length === 0) return snippetText;
    if (trimmedCurrentValue.includes(snippetText)) return trimmedCurrentValue;

    return `${trimmedCurrentValue}\n${snippetText}`;
}


function getStringResourceFieldValue(document: Document, fieldName: string): string {

    const value = document.resource[fieldName];

    return typeof value === 'string' ? value : '';
}


function shouldTrackEvidenceNumbers(document: Document): boolean {

    return [
        'Layer',
        'SoilProfilePhoto',
        'Photo',
        'Drawing',
        'Find',
        'FindCollection',
        'Sample'
    ].includes(document.resource.category);
}


function hasEvidenceNumberText(text: string): boolean {

    return /(사진|도면|유물|시료|번호|수습|채취).*(\d|[A-Z]-?\d|[가-힣]+-?\d)/.test(text)
        || /(\d|[A-Z]-?\d|[가-힣]+-?\d).*(사진|도면|유물|시료|번호|수습|채취)/.test(text);
}
