import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import { getKoreanFieldworkRecordActionSummary } from './korean-fieldwork-record-actions';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork record actions', () => {
  it('recommends the next structural child and first evidence for a fieldwork unit', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
      fieldRecordQuality: [],
      recordCreationTiming: '',
    });

    const summary = getKoreanFieldworkRecordActionSummary(
      operation,
      [operation],
      [C.TRENCH, C.PHOTO]
    );

    expect(summary).toMatchObject({
      isTracked: true,
      categoryLabel: '조사구역',
      structureCount: 0,
      evidenceCount: 0,
      issueCount: 0,
      tone: 'warning',
    });
    expect(summary.actions.map((action) => action.id)).toEqual([
      'create-Trench',
      'create-photos',
    ]);
  });

  it('prioritizes readiness issues before creating more records', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {}, {
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: [],
      fieldRecordQuality: ['immediateRecording'],
      recordCreationTiming: 'duringFieldwork',
    });

    const summary = getKoreanFieldworkRecordActionSummary(
      feature,
      [feature],
      [C.FEATURE_SEGMENT, C.PHOTO]
    );

    expect(summary.issueCount).toBe(1);
    expect(summary.actions[0]).toMatchObject({
      id: 'issue-feature-complete-photo-feature-1',
      type: 'openDocument',
      label: '이 기록 점검',
      tone: 'warning',
      document: feature,
    });
    expect(summary.actions.map((action) => action.id)).toContain(
      'create-FeatureSegment'
    );
  });

  it('opens existing evidence when there is no missing evidence action to create', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const photo = createDoc('photo-1', C.PHOTO, '수혈 1 사진', {
      depicts: ['feature-1'],
    });

    const summary = getKoreanFieldworkRecordActionSummary(
      feature,
      [feature, photo],
      []
    );

    expect(summary.actions).toContainEqual(expect.objectContaining({
      id: 'open-photos',
      type: 'openDocument',
      label: '사진 열기',
      document: photo,
    }));
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {},
  extraResource: Record<string, unknown> = {}
): Document => ({
  _id: id,
  created: { user: 'test', date: new Date('2026-06-23T00:00:00.000Z') },
  modified: [],
  resource: {
    id,
    identifier,
    category,
    relations,
    ...extraResource,
  },
});
