import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  getKoreanFieldworkRecordWorkFilterCounts,
  matchesKoreanFieldworkRecordWorkFilter,
} from './korean-fieldwork-record-work-filters';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork record work filters', () => {
  it('matches records with readiness issues', () => {
    const document = createDocument('feature-1', C.FEATURE);

    expect(matchesKoreanFieldworkRecordWorkFilter(
      document,
      'needsReview',
      [document],
      { 'feature-1': 2 }
    )).toBe(true);
    expect(matchesKoreanFieldworkRecordWorkFilter(
      document,
      'needsReview',
      [document],
      {}
    )).toBe(false);
  });

  it('matches candidate and recheck records', () => {
    const candidate = createDocument('candidate', C.FEATURE, {
      featureRecordingStatus: 'candidate',
    });
    const recheck = createDocument('recheck', C.TRENCH, {
      verificationState: 'needsRecheck',
    });
    const observed = createDocument('observed', C.TRENCH, {
      verificationState: 'observedInField',
    });

    expect(matchesKoreanFieldworkRecordWorkFilter(candidate, 'pending', [], {}))
      .toBe(true);
    expect(matchesKoreanFieldworkRecordWorkFilter(recheck, 'pending', [], {}))
      .toBe(true);
    expect(matchesKoreanFieldworkRecordWorkFilter(observed, 'pending', [], {}))
      .toBe(false);
  });

  it('matches records with missing evidence chips', () => {
    const feature = createDocument('feature-1', C.FEATURE);
    const photo = createDocument('photo-1', C.PHOTO, {
      relations: { depicts: ['feature-1'] },
    });

    expect(matchesKoreanFieldworkRecordWorkFilter(
      feature,
      'missingEvidence',
      [feature],
      {}
    )).toBe(true);
    expect(matchesKoreanFieldworkRecordWorkFilter(
      photo,
      'missingEvidence',
      [feature, photo],
      {}
    )).toBe(false);
  });

  it('matches records created or modified today', () => {
    const now = new Date('2026-06-23T10:00:00+09:00');
    const createdToday = createDocument('created', C.FEATURE, {}, '2026-06-23T01:00:00+09:00');
    const modifiedToday = createDocument(
      'modified',
      C.FEATURE,
      {},
      '2026-06-22T01:00:00+09:00',
      '2026-06-23T09:00:00+09:00'
    );
    const yesterday = createDocument('old', C.FEATURE, {}, '2026-06-22T01:00:00+09:00');

    expect(matchesKoreanFieldworkRecordWorkFilter(createdToday, 'today', [], {}, now))
      .toBe(true);
    expect(matchesKoreanFieldworkRecordWorkFilter(modifiedToday, 'today', [], {}, now))
      .toBe(true);
    expect(matchesKoreanFieldworkRecordWorkFilter(yesterday, 'today', [], {}, now))
      .toBe(false);
  });

  it('counts records for tablet work filter chips', () => {
    const now = new Date('2026-06-23T10:00:00+09:00');
    const documents = [
      createDocument('operation-1', C.OPERATION),
      createDocument('feature-1', C.FEATURE, {
        featureRecordingStatus: 'candidate',
      }, '2026-06-23T01:00:00+09:00'),
      createDocument('photo-1', C.PHOTO),
    ];

    expect(getKoreanFieldworkRecordWorkFilterCounts(
      documents,
      documents,
      { 'operation-1': 1 },
      now
    )).toEqual({
      all: 3,
      needsReview: 1,
      pending: 1,
      missingEvidence: 2,
      today: 1,
    });
  });
});

const createDocument = (
  id: string,
  category: string,
  resource: Record<string, unknown> = {},
  createdDate = '2026-06-22T01:00:00+09:00',
  modifiedDate?: string
): Document => ({
  _id: id,
  resource: {
    id,
    identifier: id,
    category,
    relations: {},
    ...resource,
  },
  created: {
    user: 'tester',
    date: createdDate,
  },
  modified: modifiedDate
    ? [{ user: 'tester', date: modifiedDate }]
    : [],
} as unknown as Document);
