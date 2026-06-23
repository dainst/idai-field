import { Document } from 'idai-field-core';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  applyKoreanFieldworkFieldNoteObservationPrompt,
  buildKoreanFieldworkFieldNoteText,
  createKoreanFieldworkDailyLogDraft,
  createKoreanFieldworkRecordMemoDraft,
  extractKoreanFieldworkFieldNoteInput,
  getKoreanFieldworkFieldNoteChecklist,
  getKoreanFieldworkFieldNoteEvidenceActions,
  getKoreanFieldworkFieldNoteFollowUpActions,
  getKoreanFieldworkFieldNoteGuidance,
  getKoreanFieldworkFieldNoteHistoryItems,
  getKoreanFieldworkFieldNoteIssuePrompts,
  getKoreanFieldworkFieldNoteObservationPrompts,
  getKoreanFieldworkFieldNotePresets,
  getKoreanFieldworkFieldNoteReportPreview,
  getKoreanFieldworkFieldNoteRecordUpdates,
  getKoreanFieldworkDailyNotebookDigest,
  getKoreanFieldworkNotebookEntries,
  getKoreanFieldworkNotebookContinuationSeed,
  getKoreanFieldworkDailyLogAppendUpdates,
  getKoreanFieldworkDailyLogForOperation,
  getKoreanFieldworkFieldNoteOperation,
  getKoreanFieldworkFieldNoteSeedFromRecord,
  getKoreanFieldworkFieldNoteSummaries,
  mergeKoreanFieldworkFieldNoteInput,
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

  it('provides context presets and merges them into existing tablet notes', () => {
    const layer = createDoc('layer-1', C.LAYER, '층위 1');
    const presets = getKoreanFieldworkFieldNotePresets(layer);
    const layerPreset = presets.find((preset) => preset.id === 'layer');

    expect(layerPreset).toBeDefined();
    expect(presets.map((preset) => preset.id)).toContain('photoDrawing');
    expect(mergeKoreanFieldworkFieldNoteInput(
      { observation: '동벽에서 회갈색 사질토 확인.' },
      layerPreset!.input
    )).toMatchObject({
      observation: [
        '동벽에서 회갈색 사질토 확인.',
        layerPreset!.input.observation,
      ].join('\n'),
      interpretation: layerPreset!.input.interpretation,
      nextWork: layerPreset!.input.nextWork,
    });
  });

  it('offers category-specific observation prompts for tablet notes', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const featurePrompts = getKoreanFieldworkFieldNoteObservationPrompts(feature);
    const boundaryPrompt = featurePrompts.find((prompt) =>
      prompt.id === 'plan-boundary'
    );

    expect(featurePrompts.map((prompt) => prompt.id)).toEqual([
      'plan-boundary',
      'size-direction',
      'fill-floor',
      'overlap',
    ]);
    expect(applyKoreanFieldworkFieldNoteObservationPrompt(
      { observation: '바닥면 정리 중.' },
      boundaryPrompt!
    ).observation).toBe([
      '바닥면 정리 중.',
      boundaryPrompt!.observation,
    ].join('\n'));
    expect(applyKoreanFieldworkFieldNoteObservationPrompt(
      { observation: boundaryPrompt!.observation },
      boundaryPrompt!
    ).observation).toBe(boundaryPrompt!.observation);
    expect(getKoreanFieldworkFieldNoteObservationPrompts(
      createDoc('feature-group-1', C.FEATURE_GROUP, '수혈군 1')
    ).map((prompt) => prompt.id)).toEqual([
      'group-scope',
      'group-pattern',
      'group-relation',
    ]);
    expect(getKoreanFieldworkFieldNoteObservationPrompts(
      createDoc('segment-1', C.FEATURE_SEGMENT, '유구 구간 1')
    ).map((prompt) => prompt.id)).toEqual([
      'segment-boundary',
      'segment-profile',
      'segment-context',
    ]);
    expect(getKoreanFieldworkFieldNoteObservationPrompts(
      createDoc('trench-1', C.TRENCH, '트렌치 1')
    ).map((prompt) => prompt.id)).toEqual([
      'trench-position',
      'trench-layer',
      'trench-feature',
    ]);
    expect(getKoreanFieldworkFieldNoteObservationPrompts(
      createDoc('layer-1', C.LAYER, '층위 1')
    ).map((prompt) => prompt.id)).toEqual([
      'soil',
      'layer-boundary',
      'formation',
    ]);
    expect(getKoreanFieldworkFieldNoteObservationPrompts(
      createDoc('find-1', C.FIND, '유물 1')
    ).map((prompt) => prompt.id)).toEqual([
      'find-context',
      'find-condition',
      'find-collection',
    ]);
    expect(getKoreanFieldworkFieldNoteObservationPrompts(
      createDoc('sample-1', C.SAMPLE, '시료 1')
    ).map((prompt) => prompt.id)).toEqual([
      'sample-context',
      'sample-method',
      'sample-storage',
    ]);
  });

  it('guides tablet note writing without forcing a verification state', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');

    expect(getKoreanFieldworkFieldNoteGuidance({
      interpretation: '주혈 가능성이 있음.',
    }, feature)).toEqual([
      expect.objectContaining({
        id: 'interpretation-without-observation',
        tone: 'attention',
      }),
      expect.objectContaining({
        id: 'next-work',
        tone: 'guide',
      }),
    ]);
    expect(getKoreanFieldworkFieldNoteGuidance({
      observation: '평면 원형 윤곽과 회갈색 사질토 확인.',
      nextWork: '사진 12번 보강 후 단면 정리.',
    }, feature)).toEqual([
      expect.objectContaining({
        id: 'observation-recorded',
        tone: 'complete',
      }),
      expect.objectContaining({
        id: 'evidence-numbers',
        tone: 'guide',
      }),
    ]);
    expect(getKoreanFieldworkFieldNoteGuidance({
      observation: '평면 원형 윤곽과 회갈색 사질토 확인.',
      nextWork: '단면 정리 완료.',
      evidenceNumbers: '사진 12-14, 도면 3',
    }, feature)).toEqual([
      expect.objectContaining({ id: 'observation-recorded' }),
      expect.objectContaining({ id: 'report-continuity' }),
    ]);
  });

  it('turns selected record gaps into tablet note prompts', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: [],
    });

    const prompts = getKoreanFieldworkFieldNoteIssuePrompts(
      feature,
      [feature]
    );

    expect(prompts).toEqual([
      expect.objectContaining({
        id: 'feature-complete-photo-feature-1',
        label: '기록 보강',
        detail: '현장 마감 전 완료 사진을 연결했는지 확인하세요.',
        input: {
          observation: '유구가 확인 상태지만 완료 사진 항목이 체크되지 않았습니다.',
          nextWork: '현장 마감 전 완료 사진을 연결했는지 확인하세요.',
        },
      }),
    ]);
  });

  it('returns allowed evidence creation actions for the selected field note record', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const photo = createDoc('photo-1', C.PHOTO, '사진 1', {
      relations: { depicts: [feature.resource.id] },
    });

    expect(getKoreanFieldworkFieldNoteEvidenceActions(
      feature,
      [feature, photo],
      [C.PHOTO, C.DRAWING]
    )).toEqual([
      expect.objectContaining({
        id: 'photos',
        categoryName: C.PHOTO,
        existingCount: 1,
      }),
      expect.objectContaining({
        id: 'drawings',
        categoryName: C.DRAWING,
        existingCount: 0,
      }),
    ]);
    expect(getKoreanFieldworkFieldNoteEvidenceActions(
      feature,
      [feature, photo],
      [C.FIND]
    ).map((action) => action.id)).toEqual(['finds']);
  });

  it('prioritizes follow-up records mentioned in the tablet field note', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const photo = createDoc('photo-1', C.PHOTO, '사진 1', {
      relations: { depicts: [feature.resource.id] },
    });
    const evidenceActions = getKoreanFieldworkFieldNoteEvidenceActions(
      feature,
      [feature, photo],
      [C.PHOTO, C.SOIL_PROFILE_PHOTO, C.DRAWING, C.FIND, C.SAMPLE]
    );

    expect(getKoreanFieldworkFieldNoteFollowUpActions({
      observation: '단면 정리 후 사진 보강.',
      nextWork: '도면 3번 정리, 유물 출토 위치 확인.',
      evidenceNumbers: '사진 12, 도면 3, 유물 24',
    }, evidenceActions).map((action) => action.id)).toEqual([
      'soilProfilePhotos',
      'drawings',
      'finds',
    ]);
    expect(getKoreanFieldworkFieldNoteFollowUpActions({
      observation: '경계만 확인.',
    }, evidenceActions)).toEqual([]);
  });

  it('builds a report continuity preview from structured tablet notes', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');

    expect(getKoreanFieldworkFieldNoteReportPreview({}, feature)).toBeUndefined();
    expect(getKoreanFieldworkFieldNoteReportPreview({
      observation: '바닥면에서 원형 윤곽을 확인.',
      interpretation: '주공 가능성이 있다.',
      nextWork: '사진 보강 후 단면 정리.',
      evidenceNumbers: '사진 12, 도면 3',
    }, feature)).toEqual({
      title: '수혈 1 보고서 연결 문장',
      sentence: '유구 수혈 1은 바닥면에서 원형 윤곽을 확인. 주공 가능성이 있다.',
      supportingDetail: '근거 번호: 사진 12, 도면 3 · 다음 작업: 사진 보강 후 단면 정리.',
      missingParts: [],
    });
    expect(getKoreanFieldworkFieldNoteReportPreview({
      observation: '평면 형태 확인.',
    }, feature)?.missingParts).toEqual([
      '관찰과 구분한 해석',
      '사진·도면·유물·시료 번호',
      '다음 작업',
    ]);
    expect(getKoreanFieldworkFieldNoteReportPreview({
      observation: '배수로로 이어지는 선형 흔적 확인.',
    }, createDoc('feature-2', C.FEATURE, '유구 2'))?.sentence)
      .toBe('유구 2는 배수로로 이어지는 선형 흔적 확인.');
  });

  it('builds selected record updates from tablet field note input', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      description: '기존 노출 양상.',
      interpretation: '기존 해석.',
    });
    const input = {
      observation: '바닥면에서 원형 윤곽을 확인.',
      interpretation: '주공 후보로 보이나 절단관계는 추가 확인 필요.',
      nextWork: '단면 정리 후 사진 보강.',
      evidenceNumbers: '사진 12-14',
    };

    const updates = getKoreanFieldworkFieldNoteRecordUpdates(input, feature);

    expect(updates).toEqual({
      fieldNote: [
        '[관찰 내용] 바닥면에서 원형 윤곽을 확인.',
        '[해석] 주공 후보로 보이나 절단관계는 추가 확인 필요.',
        '[다음 작업] 단면 정리 후 사진 보강.',
        '[사진·도면·유물·시료 번호] 사진 12-14',
      ].join('\n'),
      description: '기존 노출 양상.\n바닥면에서 원형 윤곽을 확인.',
      interpretation: [
        '기존 해석.',
        '주공 후보로 보이나 절단관계는 추가 확인 필요.',
      ].join('\n'),
    });

    expect(getKoreanFieldworkFieldNoteRecordUpdates(input, {
      ...feature,
      resource: {
        ...feature.resource,
        ...updates,
      },
    })).toEqual({});
  });

  it('builds a tablet note seed from selected record card fields', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      description: '바닥면에서 원형 윤곽 확인.',
      fieldNote: [
        '[다음 작업] 단면 정리 후 사진 보강.',
        '[사진·도면·유물·시료 번호] 사진 12',
      ].join('\n'),
      interpretation: '주공 후보.',
    });
    const photo = createDoc('photo-1', C.PHOTO, '사진 13', {
      relations: { depicts: [feature.resource.id] },
    });
    const sample = createDoc('sample-1', C.SAMPLE, '시료 S-01', {
      relations: { liesWithin: [feature.resource.id] },
    });

    expect(getKoreanFieldworkFieldNoteSeedFromRecord(feature, [
      feature,
      photo,
      sample,
    ])).toEqual({
      observation: '바닥면에서 원형 윤곽 확인.',
      interpretation: '주공 후보.',
      nextWork: '단면 정리 후 사진 보강.',
      evidenceNumbers: [
        '사진 12',
        '사진: 사진 13',
        '시료: 시료 S-01',
      ].join('\n'),
    });
  });

  it('extracts structured field note input from saved memo text', () => {
    expect(extractKoreanFieldworkFieldNoteInput([
      '[관찰 내용] 바닥면에서 원형 윤곽 확인.',
      '[해석] 주공 가능성 있음.',
      '[다음 작업] 사진 보강 후 단면 정리.',
      '[사진·도면·유물·시료 번호] 사진 12, 도면 3',
    ].join('\n'))).toEqual({
      observation: '바닥면에서 원형 윤곽 확인.',
      interpretation: '주공 가능성 있음.',
      nextWork: '사진 보강 후 단면 정리.',
      evidenceNumbers: '사진 12, 도면 3',
    });
  });

  it('builds recent field note history for the selected record only', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const memo = createDoc('memo-1', C.PEN_MEMO, '메모 1', {
      relations: { depicts: [feature.resource.id] },
      penMemoReviewedTranscript: [
        '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.',
        '[다음 작업] 사진 보강.',
      ].join('\n'),
    });
    memo.created.date = new Date('2026-06-23T01:00:00.000Z');
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '6월 23일 작업일지', {
      relations: { isRecordedIn: [operation.resource.id] },
      description: [
        '09:00 수혈 1 - [관찰 내용] 사진 보강 완료.',
        '[다음 작업] 도면 정리.',
        '10:00 수혈 2 - 유물 수습.',
        '11:00 수혈 1 - [관찰 내용] 단면 정리 완료.',
        '[다음 작업] 유물 출토 위치 보강.',
      ].join('\n'),
    });
    dailyLog.created.date = new Date('2026-06-23T02:00:00.000Z');

    const history = getKoreanFieldworkFieldNoteHistoryItems(
      feature,
      [memo, dailyLog],
      operation
    );

    expect(history.map((item) => item.document.resource.id)).toEqual([
      'daily-log-1',
      'memo-1',
    ]);
    expect(history[0]).toMatchObject({
      detail: '유물 출토 위치 보강.',
      canLoadIntoDraft: true,
      input: {
        observation: '단면 정리 완료.',
        nextWork: '유물 출토 위치 보강.',
      },
    });
  });

  it('builds a notebook ledger across memos and daily log entries', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const memo = createDoc('memo-1', C.PEN_MEMO, '메모 1', {
      relations: { depicts: [feature.resource.id] },
      date: '2026-06-23',
      penMemoReviewedTranscript: [
        '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.',
        '[다음 작업] 사진 보강.',
      ].join('\n'),
    });
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '6월 23일 작업일지', {
      relations: { isRecordedIn: [operation.resource.id] },
      date: '2026-06-23',
      description: [
        '09:00 수혈 1 - [관찰 내용] 사진 보강 완료.',
        '[사진·도면·유물·시료 번호] 사진 12',
        '10:30 A 구역 - [관찰 내용] 배수로 정리.',
        '[다음 작업] 북쪽 트렌치 배수 상태 확인.',
      ].join('\n'),
    });

    const entries = getKoreanFieldworkNotebookEntries([
      operation,
      feature,
      memo,
      dailyLog,
    ]);

    expect(entries.map((entry) => entry.id)).toEqual([
      'daily-log-1-1',
      'daily-log-1-0',
      'memo-1',
    ]);
    expect(entries[0]).toMatchObject({
      sourceLabel: '일지',
      targetLabel: 'A 구역',
      targetCategoryLabel: '조사구역',
      detail: '배수로 정리.',
      nextWork: '북쪽 트렌치 배수 상태 확인.',
      needsEvidenceNumbers: false,
    });
    expect(entries[1]).toMatchObject({
      targetLabel: '수혈 1',
      evidenceNumbers: '사진 12',
      needsEvidenceNumbers: false,
    });
    expect(entries[2]).toMatchObject({
      sourceLabel: '메모',
      targetLabel: '수혈 1',
      detail: '바닥면 정리 중 원형 윤곽 확인.',
      nextWork: '사진 보강.',
      needsEvidenceNumbers: true,
    });

    expect(getKoreanFieldworkNotebookContinuationSeed(entries[0])).toEqual({
      id: 'daily-log-1-1',
      sourceLabel: '일지',
      input: {
        observation: '배수로 정리.',
        nextWork: '북쪽 트렌치 배수 상태 확인.',
      },
    });
    expect(getKoreanFieldworkNotebookContinuationSeed(
      entries[2],
      'evidenceNumbers'
    )).toEqual({
      id: 'memo-1',
      sourceLabel: '메모 번호 보강',
      input: {
        observation: '바닥면 정리 중 원형 윤곽 확인.',
        nextWork: [
          '사진 보강.',
          '사진·도면·유물·시료 번호를 이어서 확인.',
        ].join('\n'),
      },
    });
  });

  it('builds a today digest for tablet daily note review', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const todayMemo = createDoc('memo-1', C.PEN_MEMO, '메모 1', {
      relations: { depicts: [feature.resource.id] },
      date: '2026-06-23',
      penMemoReviewedTranscript: [
        '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.',
        '[다음 작업] 사진 보강.',
      ].join('\n'),
    });
    const oldMemo = createDoc('memo-old', C.PEN_MEMO, '메모 과거', {
      relations: { depicts: [feature.resource.id] },
      date: '2026-06-22',
      penMemoReviewedTranscript: '[관찰 내용] 전날 기록.',
    });
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '6월 23일 작업일지', {
      relations: { isRecordedIn: [operation.resource.id] },
      date: '2026-06-23',
      description: [
        '10:30 A 구역 - [관찰 내용] 배수로 정리.',
        '[사진·도면·유물·시료 번호] 사진 12',
      ].join('\n'),
    });

    const digest = getKoreanFieldworkDailyNotebookDigest(
      [operation, feature, todayMemo, oldMemo, dailyLog],
      new Date('2026-06-23T12:00:00.000Z')
    );

    expect(digest.dateLabel).toBe('2026-06-23');
    expect(digest.primaryDailyLog).toBe(dailyLog);
    expect(digest.entries.map((entry) => entry.id)).toEqual([
      'daily-log-1-0',
      'memo-1',
    ]);
    expect(digest.nextWorkEntries.map((entry) => entry.id)).toEqual(['memo-1']);
    expect(digest.evidenceMissingEntries.map((entry) => entry.id)).toEqual([
      'memo-1',
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
      penMemoStrokes: '{"version":1,"strokes":[]}',
      relations: { depicts: [feature.resource.id] },
    });
  });

  it('stores handwriting coordinates in reviewed PenMemo drafts', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const draft = createKoreanFieldworkRecordMemoDraft(
      feature,
      [
        '[관찰 내용] 바닥면 정리.',
        '[손그림 좌표] {"version":1,"strokes":[{"points":[{"x":10,"y":20},{"x":40,"y":50}]}]}',
      ].join('\n'),
      fakeConfig,
      new Date(2026, 5, 23, 9, 30)
    );

    expect(draft.resource.penMemoStrokes).toBe(
      '{"version":1,"strokes":[{"points":[{"x":10,"y":20},{"x":40,"y":50}]}]}'
    );
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
