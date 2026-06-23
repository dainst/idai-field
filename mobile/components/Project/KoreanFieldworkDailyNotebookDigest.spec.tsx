import { fireEvent, render } from '@testing-library/react-native';
import { Document } from 'idai-field-core';
import React from 'react';
import KoreanFieldworkDailyNotebookDigest from './KoreanFieldworkDailyNotebookDigest';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkDailyNotebookDigest', () => {
  it('shows today note work and continues the selected item', () => {
    const operation = createDoc('operation-1', C.OPERATION, 'A 구역');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const memo = createDoc('memo-1', C.PEN_MEMO, '메모 1', {
      depicts: [feature.resource.id],
    }, {
      date: '2026-06-23',
      penMemoReviewedTranscript: [
        '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.',
        '[다음 작업] 사진 보강.',
      ].join('\n'),
    });
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '6월 23일 작업일지', {
      isRecordedIn: [operation.resource.id],
    }, {
      date: '2026-06-23',
      description: '10:30 A 구역 - [관찰 내용] 배수로 정리.',
    });
    const handleContinueEntry = jest.fn();
    const handleOpenDailyLog = jest.fn();

    const { getByTestId, getByText } = render(
      <KoreanFieldworkDailyNotebookDigest
        documents={[operation, feature, memo, dailyLog]}
        now={new Date('2026-06-23T12:00:00.000Z')}
        onContinueEntry={handleContinueEntry}
        onOpenDailyLog={handleOpenDailyLog}
      />
    );

    expect(getByText('오늘 정리')).toBeTruthy();
    expect(getByText('사진 보강.')).toBeTruthy();
    expect(getByText('일지 열기')).toBeTruthy();

    fireEvent.press(getByTestId('dailyNotebookOpenDailyLog'));
    fireEvent.press(getByTestId('dailyNotebookContinue_남은 작업_memo-1'));
    fireEvent.press(getByTestId('dailyNotebookContinue_번호 보강_memo-1'));

    expect(handleOpenDailyLog).toHaveBeenCalled();
    expect(handleContinueEntry).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: 'memo-1',
      targetDocument: feature,
    }), 'nextWork');
    expect(handleContinueEntry).toHaveBeenNthCalledWith(2, expect.objectContaining({
      id: 'memo-1',
      targetDocument: feature,
    }), 'evidenceNumbers');
  });

  it('shows an empty state when today entries have no remaining work', () => {
    const dailyLog = createDoc('daily-log-1', C.DAILY_LOG, '6월 23일 작업일지', {}, {
      date: '2026-06-23',
      description: [
        '10:30 A 구역 - [관찰 내용] 배수로 정리.',
        '[사진·도면·유물·시료 번호] 사진 12',
      ].join('\n'),
    });

    const { getByTestId, queryByText } = render(
      <KoreanFieldworkDailyNotebookDigest
        documents={[dailyLog]}
        now={new Date('2026-06-23T12:00:00.000Z')}
        onContinueEntry={jest.fn()}
        onOpenDailyLog={jest.fn()}
      />
    );

    expect(getByTestId('dailyNotebookDigestEmpty')).toBeTruthy();
    expect(queryByText('남은 작업')).toBeNull();
  });

  it('does not render without today notebook entries or a daily log', () => {
    const { queryByTestId } = render(
      <KoreanFieldworkDailyNotebookDigest
        documents={[createDoc('feature-1', C.FEATURE, '수혈 1')]}
        now={new Date('2026-06-23T12:00:00.000Z')}
        onContinueEntry={jest.fn()}
        onOpenDailyLog={jest.fn()}
      />
    );

    expect(queryByTestId('dailyNotebookDigest')).toBeNull();
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
