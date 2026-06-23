import {
  getKoreanFieldworkCategoryDescription,
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
  KOREAN_FIELDWORK_CATEGORY_ORDER,
  KOREAN_FIELDWORK_HIDDEN_ADD_CATEGORIES,
} from './korean-fieldwork-categories';

export interface KoreanFieldworkAddOption {
  categoryName: string;
  label: string;
  description: string;
}

export interface KoreanFieldworkAddOptionGroups {
  primary: KoreanFieldworkAddOption[];
  other: KoreanFieldworkAddOption[];
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const PRIMARY_OPTIONS_BY_PARENT: Readonly<Record<string, readonly string[]>> = {
  [C.OPERATION]: [
    C.TRENCH,
    C.FEATURE_GROUP,
    C.FEATURE,
    C.SURVEY_BOUNDARY,
    C.DAILY_LOG,
    C.FIELD_RECORD_QUALITY_REVIEW,
    C.AERIAL_MAP_LAYER,
    C.PEN_MEMO,
  ],
  [C.TRENCH]: [
    C.FEATURE_GROUP,
    C.FEATURE,
    C.LAYER,
    C.FIND,
    C.FIND_COLLECTION,
    C.SAMPLE,
    C.SOIL_PROFILE_PHOTO,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.FEATURE_GROUP]: [
    C.FEATURE,
    C.FEATURE_GROUP,
    C.LAYER,
    C.FIND,
    C.SAMPLE,
    C.SOIL_PROFILE_PHOTO,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.FEATURE]: [
    C.FEATURE_SEGMENT,
    C.LAYER,
    C.FIND,
    C.SAMPLE,
    C.SOIL_PROFILE_PHOTO,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.FEATURE_SEGMENT]: [
    C.LAYER,
    C.FIND,
    C.SAMPLE,
    C.SOIL_PROFILE_PHOTO,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.LAYER]: [
    C.SAMPLE,
    C.FIND,
    C.SOIL_PROFILE_PHOTO,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.SURVEY]: [
    C.SURVEY_BOUNDARY,
    C.FIND_COLLECTION,
    C.FIND,
    C.SAMPLE,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.FIND_COLLECTION]: [
    C.FIND,
    C.SAMPLE,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.FIND]: [
    C.SAMPLE,
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
  [C.SAMPLE]: [
    C.PEN_MEMO,
    C.PHOTO,
    C.DRAWING,
  ],
};

const PRIMARY_ONLY_CATEGORIES = new Set([
  C.AERIAL_MAP_LAYER,
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
  C.SURVEY_BOUNDARY,
]);

export const KOREAN_FIELDWORK_HIERARCHY_HELP =
  '조사구역 · 트렌치 · 유구군/유구 · 피트·유구 구간/층위';

export const getKoreanFieldworkAddOptions = (
  parentCategoryName: string,
  allowedCategoryNames: readonly string[]
): KoreanFieldworkAddOptionGroups => {
  const allowedSet = new Set(allowedCategoryNames.filter(isVisibleAddCategory));
  const primaryNames = (PRIMARY_OPTIONS_BY_PARENT[parentCategoryName] ?? [])
    .filter((categoryName) => allowedSet.has(categoryName));
  const primarySet = new Set(primaryNames);
  const otherNames = [...allowedSet]
    .filter((categoryName) => !primarySet.has(categoryName))
    .filter((categoryName) => !PRIMARY_ONLY_CATEGORIES.has(categoryName))
    .sort(compareKoreanFieldworkCategoryNames);

  return {
    primary: primaryNames.map(toOption),
    other: otherNames.map(toOption),
  };
};

export const isVisibleAddCategory = (categoryName: string): boolean =>
  !KOREAN_FIELDWORK_HIDDEN_ADD_CATEGORIES.includes(categoryName);

const toOption = (categoryName: string): KoreanFieldworkAddOption => ({
  categoryName,
  label: getKoreanFieldworkCategoryLabel(categoryName),
  description: getKoreanFieldworkCategoryDescription(categoryName),
});

const compareKoreanFieldworkCategoryNames = (
  categoryNameA: string,
  categoryNameB: string
): number => {
  const indexA = KOREAN_FIELDWORK_CATEGORY_ORDER.indexOf(categoryNameA);
  const indexB = KOREAN_FIELDWORK_CATEGORY_ORDER.indexOf(categoryNameB);
  const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
  const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

  return orderA === orderB
    ? categoryNameA.localeCompare(categoryNameB)
    : orderA - orderB;
};
