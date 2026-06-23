import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import {
  FEATURE_WORKFLOW_CATEGORIES,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';

export type KoreanFieldworkNarrativeField =
  'shortDescription'
  | 'description'
  | 'interpretation';

export interface KoreanFieldworkNarrativeSnippet {
  id: string;
  label: string;
  detail: string;
  icon: string;
  target: KoreanFieldworkNarrativeField;
  text: string;
  mode: 'replace' | 'append';
  categoryNames?: readonly string[];
}

export interface KoreanFieldworkNarrativeFieldGroup {
  fieldName: KoreanFieldworkNarrativeField;
  label: string;
  snippets: KoreanFieldworkNarrativeSnippet[];
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const FIELDWORK_NARRATIVE_CATEGORIES = new Set<string>([
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
  C.SURVEY,
  C.SURVEY_BOUNDARY,
  C.FIND,
  C.FIND_COLLECTION,
  C.SAMPLE,
  C.PHOTO,
  C.SOIL_PROFILE_PHOTO,
  C.DRAWING,
  C.PEN_MEMO,
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
]);

export const KOREAN_FIELDWORK_NARRATIVE_FIELD_LABELS: Readonly<
  Record<KoreanFieldworkNarrativeField, string>
> = {
  shortDescription: '짧은 설명',
  description: '묘사',
  interpretation: '해석',
};

export const KOREAN_FIELDWORK_NARRATIVE_FIELD_ORDER:
readonly KoreanFieldworkNarrativeField[] = [
  'shortDescription',
  'description',
  'interpretation',
];

export const KOREAN_FIELDWORK_NARRATIVE_SNIPPETS:
readonly KoreanFieldworkNarrativeSnippet[] = [
  {
    id: 'common-field-checked',
    label: '현장 확인',
    detail: '현장 관찰 기준',
    icon: 'done-outline',
    target: 'shortDescription',
    text: '현장에서 관찰한 내용을 기준으로 기록함.',
    mode: 'replace',
  },
  {
    id: 'common-context-description',
    label: '위치·상태',
    detail: '위치, 범위, 관계',
    icon: 'notes',
    target: 'description',
    text: '위치, 범위, 보존 상태, 주변 기록과의 관계를 현장에서 확인함.',
    mode: 'append',
  },
  {
    id: 'common-interpretation-hold',
    label: '관찰·해석',
    detail: '관찰과 해석 분리',
    icon: 'psychology-alt',
    target: 'interpretation',
    text: '현장 관찰 내용과 해석을 구분하고, 사진·도면·층위 관계 확인 사항을 함께 남김.',
    mode: 'append',
  },
  {
    id: 'operation-work-scope',
    label: '조사범위',
    detail: '범위와 기준점',
    icon: 'select-all',
    target: 'description',
    text: '조사구역의 범위, 기준점, 접근 조건을 확인하고 작업 단위를 구분함.',
    mode: 'append',
    categoryNames: [C.OPERATION, C.SURVEY_BOUNDARY],
  },
  {
    id: 'trench-position',
    label: '트렌치 위치',
    detail: '방향과 범위',
    icon: 'straighten',
    target: 'description',
    text: '트렌치의 위치, 방향, 조사 범위와 주변 유구 노출 양상을 함께 확인함.',
    mode: 'append',
    categoryNames: [C.TRENCH],
  },
  {
    id: 'feature-group-relation',
    label: '군집 관계',
    detail: '배치와 중복',
    icon: 'hub',
    target: 'description',
    text: '유구의 배치, 중복, 방향성을 기준으로 묶음 내부 관계를 구분하여 기록함.',
    mode: 'append',
    categoryNames: [C.FEATURE_GROUP],
  },
  {
    id: 'feature-candidate-summary',
    label: '검출 유구',
    detail: '경계 확인 중',
    icon: 'lightbulb-outline',
    target: 'shortDescription',
    text: '유구가 검출되어 경계와 충전토를 확인 중임.',
    mode: 'replace',
    categoryNames: FEATURE_WORKFLOW_CATEGORIES,
  },
  {
    id: 'feature-exposure',
    label: '노출 상태',
    detail: '경계와 교란',
    icon: 'visibility',
    target: 'description',
    text: '평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.',
    mode: 'append',
    categoryNames: FEATURE_WORKFLOW_CATEGORIES,
  },
  {
    id: 'feature-shape-scale',
    label: '형태·규모',
    detail: '장축, 단축, 단면',
    icon: 'architecture',
    target: 'description',
    text: '장축·단축 방향, 평면 형태, 단면 형상을 구분하여 기록함.',
    mode: 'append',
    categoryNames: FEATURE_WORKFLOW_CATEGORIES,
  },
  {
    id: 'layer-boundary',
    label: '층위 경계',
    detail: '색조와 포함물',
    icon: 'layers',
    target: 'description',
    text: '상·하부 경계, 색조, 입도, 포함물을 기준으로 층위를 구분함.',
    mode: 'append',
    categoryNames: [C.LAYER],
  },
  {
    id: 'layer-sequence',
    label: '층위 관계',
    detail: '선후관계 확인',
    icon: 'account-tree',
    target: 'interpretation',
    text: '인접 층위와의 선후관계는 단면 사진과 도면을 함께 대조하여 기록함.',
    mode: 'append',
    categoryNames: [C.LAYER],
  },
  {
    id: 'photo-context',
    label: '기록사진',
    detail: '대상과 방향',
    icon: 'photo-camera',
    target: 'shortDescription',
    text: '현장 관찰 근거 확인용 사진.',
    mode: 'replace',
    categoryNames: [C.PHOTO],
  },
  {
    id: 'photo-quality-note',
    label: '촬영 조건',
    detail: '대상, 축척, 방향',
    icon: 'center-focus-strong',
    target: 'description',
    text: '대상, 방향, 축척, 촬영 위치가 식별되도록 촬영함.',
    mode: 'append',
    categoryNames: [C.PHOTO, C.SOIL_PROFILE_PHOTO],
  },
  {
    id: 'soil-profile-photo-context',
    label: '토층사진',
    detail: '단면과 경계',
    icon: 'terrain',
    target: 'shortDescription',
    text: '토층 단면과 층위 경계 확인용 사진.',
    mode: 'replace',
    categoryNames: [C.SOIL_PROFILE_PHOTO],
  },
  {
    id: 'drawing-context',
    label: '실측도',
    detail: '현장 보정',
    icon: 'draw',
    target: 'shortDescription',
    text: '현장 실측 및 보정 확인용 도면.',
    mode: 'replace',
    categoryNames: [C.DRAWING],
  },
  {
    id: 'find-context',
    label: '출토맥락',
    detail: '위치와 층위',
    icon: 'inventory-2',
    target: 'description',
    text: '출토 위치, 관련 층위, 수습 상태를 구분하여 기록함.',
    mode: 'append',
    categoryNames: [C.FIND, C.FIND_COLLECTION],
  },
  {
    id: 'sample-context',
    label: '시료맥락',
    detail: '채취 기준',
    icon: 'science',
    target: 'description',
    text: '시료 채취 위치, 목적, 주변 퇴적 상태와 오염 가능성을 함께 기록함.',
    mode: 'append',
    categoryNames: [C.SAMPLE],
  },
];

export const getKoreanFieldworkNarrativeFieldGroups = (
  category: CategoryForm | undefined,
  resource: NewResource
): KoreanFieldworkNarrativeFieldGroup[] => {
  const fieldNames = getCategoryFieldNames(category);
  const snippets = getKoreanFieldworkNarrativeSnippets(category, resource);

  return KOREAN_FIELDWORK_NARRATIVE_FIELD_ORDER
    .filter((fieldName) => fieldNames.has(fieldName))
    .map((fieldName) => ({
      fieldName,
      label: KOREAN_FIELDWORK_NARRATIVE_FIELD_LABELS[fieldName],
      snippets: snippets.filter((snippet) => snippet.target === fieldName),
    }))
    .filter((group) => group.snippets.length > 0);
};

export const getKoreanFieldworkNarrativeSnippets = (
  category: CategoryForm | undefined,
  resource: NewResource
): KoreanFieldworkNarrativeSnippet[] => {
  const fieldNames = getCategoryFieldNames(category);

  if (!FIELDWORK_NARRATIVE_CATEGORIES.has(resource.category)) return [];

  return KOREAN_FIELDWORK_NARRATIVE_SNIPPETS
    .filter((snippet) => fieldNames.has(snippet.target))
    .filter((snippet) => isSnippetAvailableForCategory(snippet, resource.category));
};

export const getKoreanFieldworkNarrativeSnippetValue = (
  resource: NewResource,
  snippet: KoreanFieldworkNarrativeSnippet
): string => {
  if (snippet.mode === 'replace') return snippet.text;

  return appendNarrativeText(
    getStringResourceFieldValue(resource, snippet.target),
    snippet.text
  );
};

const isSnippetAvailableForCategory = (
  snippet: KoreanFieldworkNarrativeSnippet,
  categoryName: string
): boolean => !snippet.categoryNames
  || snippet.categoryNames.includes(categoryName);

const appendNarrativeText = (
  currentValue: string,
  snippetText: string
): string => {
  const trimmedCurrentValue = currentValue.trimEnd();

  if (trimmedCurrentValue.length === 0) return snippetText;
  if (trimmedCurrentValue.includes(snippetText)) return trimmedCurrentValue;

  return `${trimmedCurrentValue}\n${snippetText}`;
};

const getCategoryFieldNames = (
  category: CategoryForm | undefined
): Set<string> => {
  if (!category) return new Set();

  return new Set(category.groups.flatMap((group) =>
    group.fields.map((field) => field.name)
  ));
};

const getStringResourceFieldValue = (
  resource: NewResource,
  fieldName: string
): string => {
  const value = (resource as unknown as Record<string, unknown>)[fieldName];

  return typeof value === 'string' ? value : '';
};
