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

  it('normalizes legacy operation prefixes in parent paths', () => {
    const legacyPrefix = '\uD604\uC7A5\uB2E8\uC704-';
    const displayPrefix = '\uC870\uC0AC\uAD6C\uC5ED-';
    const operation = createDoc(
      'operation-1',
      C.OPERATION,
      `${legacyPrefix}20260625`
    );
    const boundary = createDoc('boundary-1', C.SURVEY_BOUNDARY, 'Boundary 1', {
      isRecordedIn: ['operation-1'],
    });
    const documentsById = indexById([operation, boundary]);

    expect(formatKoreanFieldworkParentPath(boundary, documentsById))
      .toBe(`${displayPrefix}20260625`);
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
      featureType: 'pit',
      featureRecordingStatus: 'candidate',
      verificationState: 'needsRecheck',
      recordCreationTiming: 'duringFieldwork',
      featureGeometryEditStatus: 'roughSketch',
      fieldRecordQuality: [],
    });

    expect(getKoreanFieldworkRecordStatusChips(feature)).toEqual([
      { label: '수혈', tone: 'info' },
      { label: '조사 전', tone: 'warning' },
      { label: '재검토', tone: 'warning' },
      { label: '추가 기록', tone: 'info' },
    ]);
  });

  it('shows quality completion when field quality checks exist', () => {
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {}, {
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'pendingDecision',
      fieldRecordQuality: ['immediateRecording', 'observationInterpretationSeparated'],
    });

    expect(getKoreanFieldworkRecordStatusChips(trench)).toContainEqual({
      label: '기록 구분 2',
      tone: 'success',
    });
  });

  it('keeps long-axis orientation visible in record status chips', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {}, {
      longAxisOrientation: '북에서 동쪽으로 23도',
      orientationReference: '자북',
    });

    expect(getKoreanFieldworkRecordStatusChips(feature)).toContainEqual({
      label: '장축 N-23°-E · 자북',
      tone: 'info',
    });
  });

  it('keeps project setup visible on operation records', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사기준 1', {}, {
      projectInvestigationMode: 'trialTrench',
      projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
    });

    expect(getKoreanFieldworkRecordStatusChips(operation)).toEqual([
      { label: '조사 표본·시굴조사', tone: 'info' },
      { label: '경계 1구역 북쪽 능선부터 남쪽 농로…', tone: 'success' },
    ]);
  });

  it('shows feature type chips from desktop interpretation values', () => {
    const feature = createDoc('feature-1', C.FEATURE, '유구 1', {}, {
      featureInterpretationType: ['other', 'pitFeature'],
    });

    expect(getKoreanFieldworkRecordStatusChips(feature)).toContainEqual({
      label: '수혈',
      tone: 'info',
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
