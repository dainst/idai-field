import {
  act,
  fireEvent,
  render,
} from '@testing-library/react-native';
import { Document } from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkFieldNotePanel from './KoreanFieldworkFieldNotePanel';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkFieldNotePanel', () => {
  beforeEach(() => {
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
        canCreateRecordMemo
        canCreateDailyLog
        onCreateNote={jest.fn().mockResolvedValue(undefined)}
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
    canCreateRecordMemo
    canCreateDailyLog
    onCreateNote={jest.fn().mockResolvedValue(undefined)}
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
