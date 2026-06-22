import {
  formatKoreanFieldworkParentPath,
  getKoreanFieldworkParentPath,
  getKoreanFieldworkPrimaryParent,
  getKoreanFieldworkRecordStatusChips,
} from './korean-fieldwork-record-summary';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('Korean fieldwork record summary', () => {
  it('uses the direct fieldwork container before the broader operation context', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {
      isRecordedIn: ['operation-1'],
      liesWithin: ['operation-1'],
    });
    const feature = createDoc('feature-1', C.FEATURE, '유구 1', {
      isRecordedIn: ['operation-1'],
      liesWithin: ['trench-1'],
    });
    const documentsById = indexById([operation, trench, feature]);

    expect(getKoreanFieldworkPrimaryParent(feature, documentsById))
      .toBe(trench);
    expect(getKoreanFieldworkParentPath(feature, documentsById))
      .toEqual([operation, trench]);
    expect(formatKoreanFieldworkParentPath(feature, documentsById))
      .toBe('조사구역 1 > T1');
  });

  it('falls back to operation context for operation-level records', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '작업일지', {
      isRecordedIn: ['operation-1'],
    });
    const documentsById = indexById([operation, dailyLog]);

    expect(formatKoreanFieldworkParentPath(dailyLog, documentsById))
      .toBe('조사구역 1');
  });

  it('keeps the Korean excavation hierarchy visible down to pit/detail records', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {
      isRecordedIn: ['operation-1'],
      liesWithin: ['operation-1'],
    });
    const featureGroup = createDoc('feature-group-1', C.FEATURE_GROUP, '수혈군 A', {
      isRecordedIn: ['operation-1'],
      liesWithin: ['trench-1'],
    });
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      isRecordedIn: ['operation-1'],
      liesWithin: ['feature-group-1'],
    });
    const pit = createDoc('pit-1', C.FEATURE_SEGMENT, '피트 A-1', {
      isRecordedIn: ['operation-1'],
      liesWithin: ['feature-1'],
    });
    const documentsById = indexById([
      operation,
      trench,
      featureGroup,
      feature,
      pit,
    ]);

    expect(formatKoreanFieldworkParentPath(pit, documentsById))
      .toBe('조사구역 1 > T1 > 수혈군 A > 수혈 1');
  });

  it('summarizes fieldwork state chips from Korean workflow fields', () => {
    const feature = createDoc('feature-1', C.FEATURE, '유구 1', {}, {
      featureRecordingStatus: 'candidate',
      verificationState: 'needsRecheck',
      recordCreationTiming: 'duringFieldwork',
      featureGeometryEditStatus: 'roughSketch',
      fieldRecordQuality: [],
    });

    expect(getKoreanFieldworkRecordStatusChips(feature)).toEqual([
      { label: '유구 후보', tone: 'warning' },
      { label: '재확인', tone: 'warning' },
      { label: '현장 작성', tone: 'success' },
      { label: '약도', tone: 'warning' },
    ]);
  });

  it('shows quality completion when field quality checks exist', () => {
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {}, {
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'pendingDecision',
      fieldRecordQuality: ['immediateRecording', 'factualAccuracy'],
    });

    expect(getKoreanFieldworkRecordStatusChips(trench)).toContainEqual({
      label: '품질 2',
      tone: 'success',
    });
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {},
  extraResource: Record<string, unknown> = {}
) => ({
  resource: {
    id,
    identifier,
    category,
    relations,
    ...extraResource,
  },
} as any);

const indexById = (documents: any[]) =>
  new Map(documents.map((document) => [document.resource.id, document]));
