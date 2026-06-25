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
      'feature-field-note-flow',
      'feature-sketch-measure-evidence',
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

  it('adds a feature field-note flow that ties observation to sketch measurements and evidence numbers', () => {
    const [descriptionGroup] = getKoreanFieldworkNarrativeFieldGroups(
      createCategoryForm(['description']),
      createResource(C.FEATURE)
    );
    const fieldNoteSnippet = descriptionGroup.snippets.find((snippet) =>
      snippet.id === 'feature-field-note-flow'
    );
    const sketchMeasureSnippet = descriptionGroup.snippets.find((snippet) =>
      snippet.id === 'feature-sketch-measure-evidence'
    );

    expect(fieldNoteSnippet).toBeTruthy();
    expect(sketchMeasureSnippet).toBeTruthy();
    expect(getKoreanFieldworkNarrativeSnippetValue(
      createResource(C.FEATURE),
      fieldNoteSnippet!
    )).toContain('[스케치·약측] 약도/평면/단면 스케치 번호');
    expect(getKoreanFieldworkNarrativeSnippetValue(
      createResource(C.FEATURE),
      fieldNoteSnippet!
    )).toContain('[유구 성격] 미정/추정으로 둘 수 있으며');
    expect(getKoreanFieldworkNarrativeSnippetValue(
      createResource(C.FEATURE),
      sketchMeasureSnippet!
    )).toBe(
      '[스케치·약측] 약도/평면/단면 스케치 번호, 측정 기준선, 장축×단축, 깊이, 촬영·도면 번호, 설명에서 참조할 부분을 함께 기록.'
    );
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
