import {
  CategoryForm,
  NewResource,
} from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  getKoreanFieldworkNarrativeFieldGroups,
  getKoreanFieldworkNarrativeSnippetValue,
} from './korean-fieldwork-narrative-assist';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork narrative assist', () => {
  it('offers category-specific field-note snippets only for available fields', () => {
    const groups = getKoreanFieldworkNarrativeFieldGroups(
      createCategoryForm(['shortDescription', 'description']),
      createResource(C.FEATURE)
    );

    expect(groups.map((group) => group.fieldName)).toEqual([
      'shortDescription',
      'description',
    ]);
    expect(groups.flatMap((group) =>
      group.snippets.map((snippet) => snippet.id)
    )).toEqual(expect.arrayContaining([
      'common-field-checked',
      'feature-candidate-summary',
      'common-context-description',
      'feature-exposure',
      'feature-shape-scale',
    ]));
    expect(groups.flatMap((group) =>
      group.snippets.map((snippet) => snippet.id)
    )).not.toContain('common-interpretation-hold');
  });

  it('appends narrative text without duplicating existing snippets', () => {
    const [descriptionGroup] = getKoreanFieldworkNarrativeFieldGroups(
      createCategoryForm(['description']),
      createResource(C.FEATURE, {
        description: '기존 노출 양상 기록.',
      })
    );
    const exposureSnippet = descriptionGroup.snippets.find((snippet) =>
      snippet.id === 'feature-exposure'
    );

    expect(exposureSnippet).toBeTruthy();
    expect(getKoreanFieldworkNarrativeSnippetValue(
      createResource(C.FEATURE, {
        description: '기존 노출 양상 기록.',
      }),
      exposureSnippet!
    )).toBe('기존 노출 양상 기록.\n평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.');

    expect(getKoreanFieldworkNarrativeSnippetValue(
      createResource(C.FEATURE, {
        description: '평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.',
      }),
      exposureSnippet!
    )).toBe('평면 노출 상태, 경계의 명확성, 교란 여부를 확인함.');
  });

  it('replaces short descriptions with concise field-note labels', () => {
    const [shortDescriptionGroup] = getKoreanFieldworkNarrativeFieldGroups(
      createCategoryForm(['shortDescription']),
      createResource(C.PHOTO, {
        shortDescription: '이전 설명',
      })
    );
    const photoSnippet = shortDescriptionGroup.snippets.find((snippet) =>
      snippet.id === 'photo-context'
    );

    expect(photoSnippet).toBeTruthy();
    expect(getKoreanFieldworkNarrativeSnippetValue(
      createResource(C.PHOTO, {
        shortDescription: '이전 설명',
      }),
      photoSnippet!
    )).toBe('현장 관찰 근거 확인용 사진.');
  });
});

const createCategoryForm = (fieldNames: string[]): CategoryForm => ({
  groups: [
    {
      name: 'fieldwork',
      fields: fieldNames.map((name) => ({ name })),
    },
  ],
} as CategoryForm);

const createResource = (
  category: string,
  extraResource: Record<string, unknown> = {}
): NewResource => ({
  identifier: `${category}-1`,
  category,
  relations: {},
  ...extraResource,
});
