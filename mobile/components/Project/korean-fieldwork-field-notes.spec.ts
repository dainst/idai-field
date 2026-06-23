import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  buildKoreanFieldworkFieldNoteText,
  createKoreanFieldworkDailyLogDraft,
  createKoreanFieldworkRecordMemoDraft,
  getKoreanFieldworkFieldNoteChecklist,
  getKoreanFieldworkDailyLogAppendUpdates,
  getKoreanFieldworkDailyLogForOperation,
  getKoreanFieldworkFieldNoteOperation,
  getKoreanFieldworkFieldNoteSummaries,
} from './korean-fieldwork-field-notes';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('korean-fieldwork-field-notes', () => {
  it('builds structured tablet field note text and checklist guidance', () => {
    const input = {
      observation: '바닥면에서 원형 윤곽과 회갈색 사질토 확인.',
      interpretation: '주혈 가능성이 있으나 절단관계는 추가 확인 필요.',
      nextWork: '단면 정리 후 사진 보강.',
      evidenceNumbers: '사진 12-14, 도면 3',
    };

    expect(buildKoreanFieldworkFieldNoteText(input)).toBe([
      '[관찰 내용] 바닥면에서 원형 윤곽과 회갈색 사질토 확인.',
      '[해석] 주혈 가능성이 있으나 절단관계는 추가 확인 필요.',
      '[다음 작업] 단면 정리 후 사진 보강.',
      '[사진·도면·유물·시료 번호] 사진 12-14, 도면 3',
    ].join('\n'));
    expect(getKoreanFieldworkFieldNoteChecklist(input).every((item) =>
      item.isComplete
    )).toBe(true);
    expect(getKoreanFieldworkFieldNoteChecklist({
      observation: '윤곽 확인',
    }).map((item) => [item.id, item.isComplete])).toEqual([
      ['observation', true],
      ['interpretation', false],
      ['nextWork', false],
      ['evidenceNumbers', false],
    ]);
  });

  it('finds the operation for a selected trench or feature record', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const trench = createDoc('trench-1', C.TRENCH, 'T1', {
      relations: { isRecordedIn: [operation.resource.id] },
    });
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      relations: { liesWithin: [trench.resource.id] },
    });

    expect(getKoreanFieldworkFieldNoteOperation(
      trench,
      [operation, trench]
    )).toBe(operation);
    expect(getKoreanFieldworkFieldNoteOperation(
      feature,
      [operation, trench, feature]
    )).toBe(operation);
  });

  it('creates a selected record memo as a reviewed PenMemo', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const draft = createKoreanFieldworkRecordMemoDraft(
      feature,
      '바닥면을 정리했고 주공 후보 2기를 추가 확인.',
      fakeConfig,
      new Date(2026, 5, 23, 9, 30)
    );

    expect(draft.resource).toMatchObject({
      category: C.PEN_MEMO,
      date: '2026-06-23',
      description: '바닥면을 정리했고 주공 후보 2기를 추가 확인.',
      penMemoReviewedTranscript: '바닥면을 정리했고 주공 후보 2기를 추가 확인.',
      penMemoTranscriptionStatus: 'reviewed',
      penMemoStrokes: '[]',
      relations: { depicts: [feature.resource.id] },
    });
  });

  it('creates and appends daily log entries under the operation', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const draft = createKoreanFieldworkDailyLogDraft(
      operation,
      feature,
      '사진 12번 촬영 후 유물 수습은 추가 확인.',
      fakeConfig,
      new Date(2026, 5, 23, 10, 5)
    );

    expect(draft.resource).toMatchObject({
      category: C.DAILY_LOG,
      description: '10:05 수혈 1 - 사진 12번 촬영 후 유물 수습은 추가 확인.',
      dailyLogContent: [
        'workArea',
        'featureProgress',
        'photoDrawingNumbers',
        'findSampleCollection',
        'changeReason',
      ],
      dailyLogEvidenceRole: ['sameDayFactRecord'],
      dailyLogReview: ['sameDayWritten'],
      relations: { isRecordedIn: [operation.resource.id] },
    });

    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '6월 23일 일지', {
      relations: { isRecordedIn: [operation.resource.id] },
      date: '2026-06-23',
      description: '08:30 A 구역 - 제토 시작.',
      dailyLogContent: ['strippingProgress'],
      dailyLogEvidenceRole: [],
      dailyLogReview: [],
    });
    const oldDailyLog = createDoc('daily-log-old', C.DAILY_LOG, '6월 22일 일지', {
      relations: { isRecordedIn: [operation.resource.id] },
      date: '2026-06-22',
    });
    const updates = getKoreanFieldworkDailyLogAppendUpdates(
      dailyLog,
      feature,
      '배수 상태 재검토.',
      new Date(2026, 5, 23, 11, 20)
    );

    expect(getKoreanFieldworkDailyLogForOperation(
      operation,
      [oldDailyLog, dailyLog],
      new Date(2026, 5, 23, 12, 0)
    )).toBe(dailyLog);
    expect(getKoreanFieldworkDailyLogForOperation(
      operation,
      [oldDailyLog],
      new Date(2026, 5, 23, 12, 0)
    )).toBeUndefined();
    expect(updates).toMatchObject({
      description: '08:30 A 구역 - 제토 시작.\n11:20 수혈 1 - 배수 상태 재검토.',
      dailyLogContent: [
        'strippingProgress',
        'workArea',
        'featureProgress',
        'safetyIssue',
        'changeReason',
      ],
      dailyLogEvidenceRole: ['sameDayFactRecord'],
      dailyLogReview: ['sameDayWritten'],
    });
  });

  it('summarizes linked memos and daily logs for the selected record', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const memo = createDoc('memo-1', C.PEN_MEMO, '메모 1', {
      relations: { depicts: [feature.resource.id] },
      penMemoReviewedTranscript: '층 경계가 흐려 추가 청소 필요.',
    });
    memo.created.date = new Date('2026-06-23T01:00:00.000Z');
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '일지 1', {
      relations: { isRecordedIn: [operation.resource.id] },
      description: '09:00 A 구역 - 시작.\n11:00 수혈 1 - 사진 보강.',
    });
    dailyLog.created.date = new Date('2026-06-23T02:00:00.000Z');

    expect(getKoreanFieldworkFieldNoteSummaries(
      feature,
      [memo, dailyLog],
      operation
    )).toEqual([
      expect.objectContaining({
        document: dailyLog,
        detail: '11:00 수혈 1 - 사진 보강.',
      }),
      expect.objectContaining({
        document: memo,
        detail: '층 경계가 흐려 추가 청소 필요.',
      }),
    ]);
  });
});

const fakeConfig = {
  isAllowedRelationDomainCategory: (
    categoryName: string,
    parentCategoryName: string,
    relationName: string
  ) => {
    if (categoryName === C.PEN_MEMO) return relationName === 'depicts';
    if (categoryName === C.DAILY_LOG) {
      return parentCategoryName === C.OPERATION
        && relationName === 'isRecordedIn';
    }

    return false;
  },
} as any;

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
});
