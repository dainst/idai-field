import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document } from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkFieldNotePanel from './KoreanFieldworkFieldNotePanel';
import { createKoreanFieldworkFieldNoteDraftKey } from './korean-fieldwork-field-note-drafts';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkFieldNotePanel', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('saves a selected record memo from the tablet note panel', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleCreateNote = jest.fn().mockResolvedValue(undefined);

    const { getByTestId } = renderPanel(feature, {
      onCreateNote: handleCreateNote,
    });

    fireEvent.changeText(getByTestId('fieldNoteTextInput'), '바닥면 정리 중 원형 윤곽 확인.');
    fireEvent.changeText(
      getByTestId('fieldNoteInterpretationInput'),
      '주공 후보로 보이나 절단관계는 추가 확인 필요.'
    );
    fireEvent.changeText(getByTestId('fieldNoteNextWorkInput'), '단면 정리 후 사진 보강.');
    fireEvent.changeText(
      getByTestId('fieldNoteEvidenceNumbersInput'),
      '사진 12-14, 도면 3'
    );
    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteSave'));
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(handleCreateNote).toHaveBeenCalledWith(
      'recordMemo',
      [
        '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.',
        '[해석] 주공 후보로 보이나 절단관계는 추가 확인 필요.',
        '[다음 작업] 단면 정리 후 사진 보강.',
        '[사진·도면·유물·시료 번호] 사진 12-14, 도면 3',
      ].join('\n')
    );
  });

  it('switches to daily log mode and opens linked summaries', async () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '6월 23일 일지', {
      relations: { isRecordedIn: [operation.resource.id] },
      description: '09:00 A 구역 - 시작.\n11:00 수혈 1 - 사진 보강.',
    });
    const handleCreateNote = jest.fn().mockResolvedValue(undefined);
    const handleOpenDocument = jest.fn();

    const { getByTestId } = renderPanel(feature, {
      documents: [feature, operation, dailyLog],
      operationDocument: operation,
      existingDailyLog: dailyLog,
      onCreateNote: handleCreateNote,
      onOpenDocument: handleOpenDocument,
    });

    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteMode_dailyLog'));
      jest.runOnlyPendingTimers();
    });
    fireEvent.changeText(getByTestId('fieldNoteTextInput'), '사진 보강 완료.');
    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteSave'));
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });
    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteSummary_daily-log-1'));
      jest.runOnlyPendingTimers();
    });

    expect(handleCreateNote).toHaveBeenCalledWith(
      'dailyLog',
      '[관찰 내용] 사진 보강 완료.'
    );
    expect(handleOpenDocument).toHaveBeenCalledWith(dailyLog);
  });

  it('applies a field preset and saves it to both record memo and daily log', async () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleCreateNote = jest.fn().mockResolvedValue(undefined);

    const { getByTestId } = renderPanel(feature, {
      documents: [feature, operation],
      operationDocument: operation,
      onCreateNote: handleCreateNote,
    });

    await act(async () => {
      fireEvent.press(getByTestId('fieldNotePreset_featureProgress'));
      fireEvent.press(getByTestId('fieldNoteMode_both'));
      jest.runOnlyPendingTimers();
    });
    fireEvent.changeText(
      getByTestId('fieldNoteEvidenceNumbersInput'),
      '사진 21-24, 도면 5'
    );
    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteSave'));
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(handleCreateNote).toHaveBeenCalledWith(
      'both',
      expect.stringContaining('[관찰 내용]')
    );
    expect(handleCreateNote).toHaveBeenCalledWith(
      'both',
      expect.stringContaining('사진 21-24, 도면 5')
    );
  });

  it('adds observation prompts to the tablet field note text', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleCreateNote = jest.fn().mockResolvedValue(undefined);

    const { getByTestId } = renderPanel(feature, {
      onCreateNote: handleCreateNote,
    });

    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteObservationPrompt_plan-boundary'));
      fireEvent.press(getByTestId('fieldNoteObservationPrompt_size-direction'));
      jest.runOnlyPendingTimers();
    });

    expect(getByTestId('fieldNoteTextInput').props.value).toContain(
      '평면 형태, 윤곽선, 경계의 명확도와 절단관계를 기록.'
    );
    expect(getByTestId('fieldNoteTextInput').props.value).toContain(
      '장축·단축·깊이, 방향, 기준점을 기록.'
    );

    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteSave'));
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(handleCreateNote).toHaveBeenCalledWith(
      'recordMemo',
      expect.stringContaining('[관찰 내용]')
    );
  });

  it('shows field note guidance while writing', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');

    const { getByTestId, queryByTestId } = renderPanel(feature);

    expect(getByTestId('fieldNoteGuidance_observation-first')).toBeTruthy();

    fireEvent.changeText(
      getByTestId('fieldNoteInterpretationInput'),
      '주혈 가능성이 있음.'
    );

    expect(
      getByTestId('fieldNoteGuidance_interpretation-without-observation')
    ).toBeTruthy();

    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '평면 원형 윤곽과 회갈색 사질토 확인.'
    );
    fireEvent.changeText(
      getByTestId('fieldNoteNextWorkInput'),
      '사진 12번 보강 후 단면 정리.'
    );

    expect(getByTestId('fieldNoteGuidance_evidence-numbers')).toBeTruthy();
    expect(queryByTestId(
      'fieldNoteGuidance_interpretation-without-observation'
    )).toBeNull();
  });

  it('shows a report continuity preview while writing a tablet note', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');

    const { getByTestId, queryByTestId } = renderPanel(feature);

    expect(queryByTestId('fieldNoteReportPreview')).toBeNull();

    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '바닥면에서 원형 윤곽을 확인.'
    );

    expect(getByTestId('fieldNoteReportPreview')).toBeTruthy();
    expect(getByTestId('fieldNoteReportPreview').props.children).toBeTruthy();
  });

  it('starts evidence records directly from the tablet note panel', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleAddDocumentOfCategory = jest.fn();

    const { getByTestId } = renderPanel(feature, {
      allowedAddCategoryNames: [C.PHOTO, C.DRAWING, C.FIND, C.SAMPLE],
      onAddDocumentOfCategory: handleAddDocumentOfCategory,
    });

    fireEvent.press(getByTestId('fieldNoteEvidenceAction_photos'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(
      feature,
      C.PHOTO
    );
  });

  it('suggests follow-up evidence records after saving a tablet note', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleCreateNote = jest.fn().mockResolvedValue(undefined);
    const handleAddDocumentOfCategory = jest.fn();

    const { getByTestId, queryByTestId } = renderPanel(feature, {
      allowedAddCategoryNames: [C.PHOTO, C.DRAWING],
      onAddDocumentOfCategory: handleAddDocumentOfCategory,
      onCreateNote: handleCreateNote,
    });

    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '사진 보강 필요.'
    );
    fireEvent.changeText(
      getByTestId('fieldNoteNextWorkInput'),
      '도면 정리.'
    );
    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteSave'));
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(getByTestId('fieldNoteFollowUpAction_photos')).toBeTruthy();
    expect(getByTestId('fieldNoteFollowUpAction_drawings')).toBeTruthy();

    fireEvent.press(getByTestId('fieldNoteFollowUpAction_photos'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(
      feature,
      C.PHOTO
    );

    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '새 관찰 내용.'
    );

    expect(queryByTestId('fieldNoteFollowUpAction_photos')).toBeNull();
  });

  it('does not show evidence actions that are not allowed under the record', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');

    const { queryByTestId } = renderPanel(feature, {
      allowedAddCategoryNames: [C.DAILY_LOG],
    });

    expect(queryByTestId('fieldNoteEvidenceAction_photos')).toBeNull();
  });

  it('loads a recent structured field note into the tablet note form', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const memo = createDoc('memo-1', C.PEN_MEMO, '메모 1', {
      relations: { depicts: [feature.resource.id] },
      penMemoReviewedTranscript: [
        '[관찰 내용] 바닥면에서 원형 윤곽 확인.',
        '[해석] 주공 가능성 있음.',
        '[다음 작업] 사진 보강 후 단면 정리.',
        '[사진·도면·유물·시료 번호] 사진 12, 도면 3',
      ].join('\n'),
    });
    const handleOpenDocument = jest.fn();

    const { getByTestId } = renderPanel(feature, {
      documents: [feature, memo],
      onOpenDocument: handleOpenDocument,
    });

    expect(getByTestId('fieldNoteHistory_memo-1')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteHistoryLoad_memo-1'));
      jest.runOnlyPendingTimers();
    });

    expect(getByTestId('fieldNoteTextInput').props.value).toBe(
      '바닥면에서 원형 윤곽 확인.'
    );
    expect(getByTestId('fieldNoteInterpretationInput').props.value).toBe(
      '주공 가능성 있음.'
    );
    expect(getByTestId('fieldNoteNextWorkInput').props.value).toBe(
      '사진 보강 후 단면 정리.'
    );
    expect(getByTestId('fieldNoteEvidenceNumbersInput').props.value).toBe(
      '사진 12, 도면 3'
    );

    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteHistoryOpen_memo-1'));
      jest.runOnlyPendingTimers();
    });

    expect(handleOpenDocument).toHaveBeenCalledWith(memo);
  });

  it('loads a notebook continuation seed into the tablet note form', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');

    const { getByTestId, queryByTestId } = renderPanel(feature, {
      continuationSeed: {
        id: 'memo-1',
        sourceLabel: '메모',
        input: {
          observation: '바닥면에서 원형 윤곽 확인.',
          nextWork: '사진 보강 후 단면 정리.',
        },
      },
    });

    await waitFor(() =>
      expect(getByTestId('fieldNoteTextInput').props.value).toBe(
        '바닥면에서 원형 윤곽 확인.'
      )
    );

    expect(getByTestId('fieldNoteNextWorkInput').props.value).toBe(
      '사진 보강 후 단면 정리.'
    );
    expect(getByTestId('fieldNoteContinuationStatus')).toBeTruthy();

    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '사진 보강 완료 후 단면 정리 시작.'
    );

    expect(queryByTestId('fieldNoteContinuationStatus')).toBeNull();
  });

  it('autosaves typed field notes and restores them for the same project record', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const draftKey = createKoreanFieldworkFieldNoteDraftKey(
      'project-1',
      feature.resource.id
    );
    const { getByTestId, unmount } = renderPanel(feature, {
      draftScopeId: 'project-1',
    });

    await waitFor(() =>
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(draftKey)
    );

    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '바닥면 정리 중 원형 윤곽 확인.'
    );

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        draftKey,
        expect.stringContaining('바닥면 정리 중 원형 윤곽 확인.')
      )
    );
    unmount();

    const { getByTestId: getRestoredByTestId } = renderPanel(feature, {
      draftScopeId: 'project-1',
    });

    await waitFor(() =>
      expect(getRestoredByTestId('fieldNoteTextInput').props.value).toBe(
        '바닥면 정리 중 원형 윤곽 확인.'
      )
    );
  });

  it('clears the autosaved draft after the note is saved', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const draftKey = createKoreanFieldworkFieldNoteDraftKey(
      'project-1',
      feature.resource.id
    );
    const handleCreateNote = jest.fn().mockResolvedValue(undefined);

    const { getByTestId } = renderPanel(feature, {
      draftScopeId: 'project-1',
      onCreateNote: handleCreateNote,
    });

    await waitFor(() =>
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(draftKey)
    );
    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '단면 정리 후 사진 보강.'
    );
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        draftKey,
        expect.stringContaining('단면 정리 후 사진 보강.')
      )
    );

    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteSave'));
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(handleCreateNote).toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(draftKey);
    expect(getByTestId('fieldNoteTextInput').props.value).toBe('');
  });

  it('lets the fieldworker discard an autosaved draft', async () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const draftKey = createKoreanFieldworkFieldNoteDraftKey(
      'project-1',
      feature.resource.id
    );
    const { getByTestId } = renderPanel(feature, {
      draftScopeId: 'project-1',
    });

    await waitFor(() =>
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(draftKey)
    );
    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '임시로 적은 야장 내용.'
    );
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        draftKey,
        expect.stringContaining('임시로 적은 야장 내용.')
      )
    );

    await act(async () => {
      fireEvent.press(getByTestId('fieldNoteDraftClear'));
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(getByTestId('fieldNoteTextInput').props.value).toBe('');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(draftKey);
  });

  it('clears unsaved text when the selected record changes', () => {
    const feature = createDoc('feature-1', C.FEATURE, '유구 1');
    const trench = createDoc('trench-1', C.TRENCH, '트렌치 1');

    const { getByTestId, rerender } = renderPanel(feature);

    fireEvent.changeText(
      getByTestId('fieldNoteTextInput'),
      '유구 1 바닥면에서 확인한 내용을 임시 입력.'
    );
    rerender(
      <KoreanFieldworkFieldNotePanel
        selectedDocument={trench}
        documents={[feature, trench]}
        allowedAddCategoryNames={[]}
        canCreateRecordMemo
        canCreateDailyLog
        onCreateNote={jest.fn().mockResolvedValue(undefined)}
        onAddDocumentOfCategory={jest.fn()}
        onOpenDocument={jest.fn()}
      />
    );

    expect(getByTestId('fieldNoteTextInput').props.value).toBe('');
  });
});

const renderPanel = (
  selectedDocument: Document,
  overrides: Partial<React.ComponentProps<
    typeof KoreanFieldworkFieldNotePanel
  >> = {}
) => render(
  <KoreanFieldworkFieldNotePanel
    selectedDocument={selectedDocument}
    documents={[selectedDocument]}
    allowedAddCategoryNames={[C.PHOTO, C.DRAWING, C.FIND, C.SAMPLE]}
    canCreateRecordMemo
    canCreateDailyLog
    onCreateNote={jest.fn().mockResolvedValue(undefined)}
    onAddDocumentOfCategory={jest.fn()}
    onOpenDocument={jest.fn()}
    {...overrides}
  />
);

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
