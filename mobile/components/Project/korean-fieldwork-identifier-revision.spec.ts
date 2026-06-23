import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  canReviseKoreanFieldworkIdentifier,
  getKoreanFieldworkIdentifierRevisionUpdates,
} from './korean-fieldwork-identifier-revision';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork identifier revision', () => {
  it('keeps the field identifier when applying a report identifier', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 17');

    expect(getKoreanFieldworkIdentifierRevisionUpdates(feature, {
      nextIdentifier: ' 조선시대 3호 수혈 ',
      reason: '전면 제토 후 번호 재배정',
      now: new Date('2026-06-23T00:00:00.000Z'),
    })).toEqual({
      identifier: '조선시대 3호 수혈',
      fieldIdentifier: '수혈 17',
      reportIdentifier: '조선시대 3호 수혈',
      identifierRevisionNote: '전면 제토 후 번호 재배정',
      identifierRevisionHistory: [
        {
          previousIdentifier: '수혈 17',
          nextIdentifier: '조선시대 3호 수혈',
          fieldIdentifier: '수혈 17',
          reason: '전면 제토 후 번호 재배정',
          changedAt: '2026-06-23T00:00:00.000Z',
        },
      ],
    });
  });

  it('preserves the original field identifier across later renumbering', () => {
    const feature = createDoc('feature-1', C.FEATURE, '조선시대 3호 수혈', {
      fieldIdentifier: '수혈 17',
      reportIdentifier: '조선시대 3호 수혈',
      identifierRevisionHistory: [
        {
          previousIdentifier: '수혈 17',
          nextIdentifier: '조선시대 3호 수혈',
          fieldIdentifier: '수혈 17',
          changedAt: '2026-06-22T00:00:00.000Z',
        },
      ],
    });

    expect(getKoreanFieldworkIdentifierRevisionUpdates(feature, {
      nextIdentifier: '조선시대 4호 수혈',
      now: new Date('2026-06-23T00:00:00.000Z'),
    })).toMatchObject({
      identifier: '조선시대 4호 수혈',
      fieldIdentifier: '수혈 17',
      reportIdentifier: '조선시대 4호 수혈',
      identifierRevisionHistory: [
        {
          previousIdentifier: '수혈 17',
          nextIdentifier: '조선시대 3호 수혈',
          fieldIdentifier: '수혈 17',
        },
        {
          previousIdentifier: '조선시대 3호 수혈',
          nextIdentifier: '조선시대 4호 수혈',
          fieldIdentifier: '수혈 17',
        },
      ],
    });
  });

  it('limits renumbering to feature-level records', () => {
    expect(canReviseKoreanFieldworkIdentifier(
      createDoc('feature-group-1', C.FEATURE_GROUP, '수혈군 1')
    )).toBe(true);
    expect(canReviseKoreanFieldworkIdentifier(
      createDoc('feature-1', C.FEATURE, '수혈 1')
    )).toBe(true);
    expect(canReviseKoreanFieldworkIdentifier(
      createDoc('segment-1', C.FEATURE_SEGMENT, '피트 1')
    )).toBe(true);
    expect(canReviseKoreanFieldworkIdentifier(
      createDoc('trench-1', C.TRENCH, 'T1')
    )).toBe(false);
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  extraResource: Record<string, unknown> = {}
): Document => ({
  _id: id,
  created: { user: 'test', date: new Date('2026-06-23T00:00:00.000Z') },
  modified: [],
  resource: {
    id,
    identifier,
    category,
    relations: {},
    ...extraResource,
  },
} as Document);
