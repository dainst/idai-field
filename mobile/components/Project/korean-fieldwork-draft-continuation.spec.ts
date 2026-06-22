import {
  CategoryForm,
  ProjectConfiguration,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import { getKoreanFieldworkDraftContinuationOptions } from './korean-fieldwork-draft-continuation';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork draft continuation helpers', () => {
  it('recommends opening, continuing, next child, and evidence actions for feature records', () => {
    const options = getKoreanFieldworkDraftContinuationOptions(
      C.FEATURE,
      createConfig([
        [C.FEATURE_SEGMENT, C.FEATURE],
        [C.PHOTO, C.FEATURE],
      ])
    );

    expect(options.map((option) => option.id)).toEqual([
      'edit',
      'same',
      'next-child',
      'evidence',
    ]);
    expect(options[2].target).toEqual({
      mode: 'addChild',
      categoryName: C.FEATURE_SEGMENT,
    });
    expect(options[3].target).toEqual({
      mode: 'addChild',
      categoryName: C.PHOTO,
    });
  });

  it('does not show next or evidence actions when relations are not allowed', () => {
    const options = getKoreanFieldworkDraftContinuationOptions(
      C.TRENCH,
      createConfig([])
    );

    expect(options.map((option) => option.id)).toEqual(['edit', 'same']);
  });

  it('stays hidden for generic non-fieldwork categories', () => {
    expect(getKoreanFieldworkDraftContinuationOptions(
      'Pottery',
      createConfig([[C.PHOTO, 'Pottery']])
    )).toEqual([]);
  });
});

const createConfig = (
  allowedChildParentPairs: [string, string][]
): ProjectConfiguration => {
  const allowed = new Set(allowedChildParentPairs.map(([child, parent]) =>
    `${child}:${parent}`
  ));

  return {
    getCategory: (categoryName: string) => createCategory(categoryName),
    isAllowedRelationDomainCategory: (
      childCategoryName: string,
      parentCategoryName: string
    ) => allowed.has(`${childCategoryName}:${parentCategoryName}`),
  } as unknown as ProjectConfiguration;
};

const createCategory = (name: string): CategoryForm => ({
  name,
  groups: [],
  mustLieWithin: false,
} as unknown as CategoryForm);
