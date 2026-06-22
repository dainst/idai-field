import { render } from '@testing-library/react-native';
import { Document } from 'idai-field-core';
import React from 'react';
import KoreanFieldworkDraftContextPanel from './KoreanFieldworkDraftContextPanel';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkDraftContextPanel', () => {
  it('shows the parent record, draft category, and direct relation label', () => {
    const { getByText } = render(
      <KoreanFieldworkDraftContextPanel
        parentDocument={createDoc('operation-1', C.OPERATION, '조사구역 1')}
        resource={{
          identifier: 'trench-1',
          category: C.TRENCH,
          relations: {
            liesWithin: ['operation-1'],
            isRecordedIn: ['operation-1'],
          },
        }}
      />
    );

    expect(getByText('새 기록 맥락')).toBeTruthy();
    expect(getByText('조사구역 · 조사구역 1')).toBeTruthy();
    expect(getByText('트렌치/조사갱')).toBeTruthy();
    expect(getByText('소속')).toBeTruthy();
    expect(getByText('조사구역')).toBeTruthy();
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string
): Document => ({
  _id: id,
  created: { user: 'test', date: new Date('2026-06-23T00:00:00.000Z') },
  modified: [],
  resource: {
    id,
    identifier,
    category,
    relations: {},
  },
});
