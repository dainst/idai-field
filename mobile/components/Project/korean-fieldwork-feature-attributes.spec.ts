import { CategoryForm, Resource } from 'idai-field-core';
import {
  getKoreanFieldworkFeatureAttributeGroups,
  getKoreanFieldworkFeatureObservationPlaceholder,
} from './korean-fieldwork-feature-attributes';
import {
  KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS,
} from './korean-fieldwork-feature-types';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

describe('korean-fieldwork-feature-attributes', () => {
  it('keeps every concrete feature type connected to guided attributes', () => {
    const category = createCategoryForm([
      'firstExposureRecord',
      'foundationTraceRecord',
      'pitDwellingExposureBaulk',
      'pitDwellingFireEvidence',
      'pitDwellingFloorFacility',
      'pitFeatureFunctionAssessment',
      'postholeGroupSurvey',
      'potteryKilnIdentification',
      'potteryKilnPartInvestigation',
      'potteryKilnStructureContext',
      'productionProcessSystem',
      'productionSiteAssociatedFacility',
      'surfaceBuildingJudgement',
      'tombBurialStructureInvestigation',
      'tombInteriorRecoveryRecord',
      'tombPassageClosureSequence',
    ]);

    const concreteFeatureTypes = KOREAN_FIELDWORK_FEATURE_TYPE_OPTIONS
      .filter((option) => option.value !== 'unknown');

    for (const option of concreteFeatureTypes) {
      const groups = getKoreanFieldworkFeatureAttributeGroups(
        category,
        createResource({ featureType: option.value })
      );

      expect(groups.length).toBeGreaterThan(0);
    }
  });

  it('uses production and linear-feature attributes instead of empty detail tabs', () => {
    const category = createCategoryForm([
      'firstExposureRecord',
      'postholeGroupSurvey',
      'productionProcessSystem',
      'productionSiteAssociatedFacility',
    ]);

    expect(getGroupTitles(category, 'production')).toEqual([
      '공정 체계',
      '부속시설',
    ]);
    expect(getGroupTitles(category, 'ditch')).toEqual(['윤곽·단면']);
    expect(getGroupTitles(category, 'fence')).toEqual(['목책열 조사']);
  });

  it('builds type-specific observation placeholders from guided attributes', () => {
    const category = createCategoryForm([
      'potteryKilnPartInvestigation',
      'potteryKilnStructureContext',
    ]);

    expect(getKoreanFieldworkFeatureObservationPlaceholder(
      category,
      createResource({ featureType: 'kiln' })
    )).toBe(
      '가마 관찰 - 가마 부위: 화구, 연소부, 소성부, 연도부 / 구조·피열: 평면형, 규모, 소성·연소 비율, 화염 흐름 / 야장 근거: 평면·단면 스케치 번호, 약측값, 사진·도면 번호, 성격 미정/추정 사유'
    );
  });

  it('keeps generic feature observations tied to sketches and rough measurements', () => {
    expect(getKoreanFieldworkFeatureObservationPlaceholder(
      createCategoryForm([]),
      createResource()
    )).toBe(
      '유구 성격 미정이면 미정으로 두고, 평면/단면 스케치 번호, 장축×단축·깊이, 충전토·중복 관계, 사진·도면 번호'
    );
  });
});

const getGroupTitles = (category: CategoryForm, featureType: string): string[] =>
  getKoreanFieldworkFeatureAttributeGroups(
    category,
    createResource({ featureType })
  ).map((group) => group.title);

const createCategoryForm = (fieldNames: string[]): CategoryForm => ({
  groups: [{
    name: 'fieldwork',
    fields: fieldNames.map((name) => ({ name })),
  }],
} as CategoryForm);

const createResource = (
  extraResource: Record<string, unknown> = {}
): Resource => ({
  id: 'resource-1',
  identifier: '유구 1',
  category: KOREAN_FIELDWORK_CATEGORIES.FEATURE,
  relations: {},
  ...extraResource,
} as unknown as Resource);
