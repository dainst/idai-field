import {
  CategoryForm,
  Document,
  ProjectConfiguration,
} from 'idai-field-core';
import { canCreateKoreanFieldworkChildRecord } from './korean-fieldwork-child-records';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';

export type KoreanFieldworkDraftContinuationMode =
  'map' | 'edit' | 'same' | 'addChild';

export interface KoreanFieldworkDraftContinuationTarget {
  mode: KoreanFieldworkDraftContinuationMode;
  categoryName?: string;
}

export interface KoreanFieldworkDraftContinuationOption {
  id: string;
  label: string;
  detail: string;
  icon: string;
  target: KoreanFieldworkDraftContinuationTarget;
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const CONTINUATION_CATEGORIES = new Set<string>([
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

const NEXT_CHILD_CATEGORY: Readonly<Record<string, string | undefined>> = {
  [C.OPERATION]: C.TRENCH,
  [C.TRENCH]: C.FEATURE,
  [C.FEATURE_GROUP]: C.FEATURE,
  [C.FEATURE]: C.FEATURE_SEGMENT,
  [C.FEATURE_SEGMENT]: C.LAYER,
};

const EVIDENCE_CATEGORY_PRIORITY: Readonly<Record<string, readonly string[]>> = {
  [C.OPERATION]: [C.SURVEY_BOUNDARY, C.DAILY_LOG, C.PEN_MEMO],
  [C.TRENCH]: [C.PHOTO, C.DRAWING, C.SOIL_PROFILE_PHOTO, C.PEN_MEMO],
  [C.FEATURE_GROUP]: [C.PHOTO, C.DRAWING, C.PEN_MEMO],
  [C.FEATURE]: [C.PHOTO, C.SOIL_PROFILE_PHOTO, C.DRAWING, C.PEN_MEMO, C.FIND, C.SAMPLE],
  [C.FEATURE_SEGMENT]: [C.PHOTO, C.SOIL_PROFILE_PHOTO, C.DRAWING, C.PEN_MEMO, C.FIND, C.SAMPLE],
  [C.LAYER]: [C.SOIL_PROFILE_PHOTO, C.SAMPLE, C.PHOTO, C.DRAWING, C.PEN_MEMO],
  [C.SURVEY]: [C.SURVEY_BOUNDARY, C.FIND_COLLECTION, C.FIND, C.PHOTO, C.PEN_MEMO],
  [C.FIND_COLLECTION]: [C.FIND, C.PHOTO, C.PEN_MEMO],
  [C.FIND]: [C.PHOTO, C.DRAWING, C.SAMPLE, C.PEN_MEMO],
  [C.SAMPLE]: [C.PHOTO, C.PEN_MEMO],
};

export const MAP_CONTINUATION_TARGET: KoreanFieldworkDraftContinuationTarget = {
  mode: 'map',
};

export const getKoreanFieldworkDraftContinuationOptions = (
  categoryName: string,
  config: ProjectConfiguration
): KoreanFieldworkDraftContinuationOption[] => {
  if (!CONTINUATION_CATEGORIES.has(categoryName)) return [];

  const options: KoreanFieldworkDraftContinuationOption[] = [
    {
      id: 'edit',
      label: '저장 후 열기',
      detail: '방금 만든 기록에서 관련 자료 작업을 바로 이어갑니다.',
      icon: 'open-in-new',
      target: { mode: 'edit' },
    },
    {
      id: 'same',
      label: '같은 종류 계속',
      detail: `${getKoreanFieldworkCategoryLabel(categoryName)}를 같은 포함 위치에서 이어 씁니다.`,
      icon: 'playlist-add',
      target: { mode: 'same' },
    },
  ];

  const nextChildCategoryName = NEXT_CHILD_CATEGORY[categoryName];
  if (nextChildCategoryName && canCreateChild(nextChildCategoryName, categoryName, config)) {
    options.push({
      id: 'next-child',
      label: `${getKoreanFieldworkCategoryLabel(nextChildCategoryName)} 추가`,
      detail: '저장한 기록에 포함할 다음 하위 기록을 바로 만듭니다.',
      icon: 'account-tree',
      target: {
        mode: 'addChild',
        categoryName: nextChildCategoryName,
      },
    });
  }

  const evidenceCategoryName = getFirstAllowedEvidenceCategory(categoryName, config);
  if (evidenceCategoryName) {
    options.push({
      id: 'evidence',
      label: `${getKoreanFieldworkCategoryLabel(evidenceCategoryName)} 추가`,
      detail: '저장한 기록에 사진·도면·시료 같은 자료를 바로 붙입니다.',
      icon: getEvidenceIcon(evidenceCategoryName),
      target: {
        mode: 'addChild',
        categoryName: evidenceCategoryName,
      },
    });
  }

  return options.slice(0, 4);
};

const getFirstAllowedEvidenceCategory = (
  parentCategoryName: string,
  config: ProjectConfiguration
): string | undefined =>
  EVIDENCE_CATEGORY_PRIORITY[parentCategoryName]
    ?.find((categoryName) => canCreateChild(categoryName, parentCategoryName, config));

const canCreateChild = (
  childCategoryName: string,
  parentCategoryName: string,
  config: ProjectConfiguration
): boolean => {
  const childCategory = getCategory(childCategoryName, config);
  if (!childCategory) return false;

  return canCreateKoreanFieldworkChildRecord(
    childCategory,
    createParentDocument(parentCategoryName),
    config
  );
};

const getCategory = (
  categoryName: string,
  config: ProjectConfiguration
): CategoryForm | undefined => {
  try {
    return config.getCategory(categoryName);
  } catch {
    return undefined;
  }
};

const createParentDocument = (categoryName: string): Document => ({
  _id: 'draft-parent',
  resource: {
    id: 'draft-parent',
    identifier: 'draft-parent',
    category: categoryName,
    relations: {},
  },
} as Document);

const getEvidenceIcon = (categoryName: string): string => {
  switch (categoryName) {
    case C.PHOTO:
      return 'photo-camera';
    case C.SOIL_PROFILE_PHOTO:
      return 'terrain';
    case C.DRAWING:
      return 'architecture';
    case C.FIND:
      return 'inventory-2';
    case C.SAMPLE:
      return 'science';
    case C.SURVEY_BOUNDARY:
      return 'timeline';
    case C.DAILY_LOG:
      return 'event-note';
    default:
      return 'note-add';
  }
};
