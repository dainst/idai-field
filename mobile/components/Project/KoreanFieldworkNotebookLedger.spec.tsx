import { fireEvent, render } from '@testing-library/react-native';
import { Document } from 'idai-field-core';
import React from 'react';
import KoreanFieldworkNotebookLedger from './KoreanFieldworkNotebookLedger';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkNotebookLedger', () => {
  it('renders recent tablet notebook entries and opens the target record', () => {
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
      description: [
        '10:30 A 구역 - [관찰 내용] 배수로 정리.',
        '[다음 작업] 북쪽 트렌치 배수 상태 확인.',
      ].join('\n'),
    });
    const handleOpenDocument = jest.fn();

    const { getByTestId, getByText } = render(
      <KoreanFieldworkNotebookLedger
        documents={[operation, feature, memo, dailyLog]}
        onOpenDocument={handleOpenDocument}
      />
    );

    expect(getByText('야장 흐름')).toBeTruthy();
    expect(getByText('배수로 정리.')).toBeTruthy();
    expect(getByText('바닥면 정리 중 원형 윤곽 확인.')).toBeTruthy();
    expect(getByText('번호 보강')).toBeTruthy();

    fireEvent.press(getByTestId('fieldNotebookEntry_memo-1'));

    expect(handleOpenDocument).toHaveBeenCalledWith(feature);
  });

  it('does not render when there are no notebook entries', () => {
    const { queryByTestId } = render(
      <KoreanFieldworkNotebookLedger
        documents={[createDoc('feature-1', C.FEATURE, '수혈 1')]}
        onOpenDocument={jest.fn()}
      />
    );

    expect(queryByTestId('fieldNotebookLedger')).toBeNull();
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
