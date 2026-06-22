import {
  getKoreanFieldworkAddOptions,
  isVisibleAddCategory,
} from './korean-fieldwork-add-options';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('korean fieldwork add options', () => {
  it('prioritizes Korean archaeological fieldwork records under operation records', () => {
    const options = getKoreanFieldworkAddOptions(C.OPERATION, [
      C.PLACE,
      C.TRENCH,
      C.FEATURE_GROUP,
      C.FEATURE,
      C.SURVEY_BOUNDARY,
      C.PEN_MEMO,
    ]);

    expect(options.primary.map((option) => option.categoryName)).toEqual([
      C.TRENCH,
      C.FEATURE_GROUP,
      C.FEATURE,
      C.SURVEY_BOUNDARY,
      C.PEN_MEMO,
    ]);
    expect(options.primary.map((option) => option.label)).toContain('유구군');
    expect(options.primary.map((option) => option.label)).not.toContain('유적/지점');
    expect(options.other).toEqual([]);
  });

  it('uses FeatureSegment as the tablet pit/detail record under features', () => {
    const options = getKoreanFieldworkAddOptions(C.FEATURE, [
      C.FEATURE_SEGMENT,
      C.LAYER,
      C.FIND,
      C.SAMPLE,
      C.PLACE,
    ]);

    expect(options.primary[0]).toMatchObject({
      categoryName: C.FEATURE_SEGMENT,
      label: '피트·유구 세부 기록',
    });
    expect(options.primary.map((option) => option.categoryName)).not.toContain(C.PLACE);
  });

  it('keeps context-specific operation records out of unrelated fallback choices', () => {
    const options = getKoreanFieldworkAddOptions(C.FEATURE, [
      C.FEATURE_SEGMENT,
      C.AERIAL_MAP_LAYER,
      C.SURVEY_BOUNDARY,
      C.PEN_MEMO,
    ]);

    expect(options.primary.map((option) => option.categoryName)).toEqual([
      C.FEATURE_SEGMENT,
      C.PEN_MEMO,
    ]);
    expect(options.other.map((option) => option.categoryName)).not.toContain(C.AERIAL_MAP_LAYER);
    expect(options.other.map((option) => option.categoryName)).not.toContain(C.SURVEY_BOUNDARY);
  });

  it('hides generic model categories from the Korean fieldwork add picker', () => {
    expect(isVisibleAddCategory(C.PLACE)).toBe(false);
    expect(isVisibleAddCategory('Image')).toBe(false);
    expect(isVisibleAddCategory(C.FEATURE)).toBe(true);
  });
});
