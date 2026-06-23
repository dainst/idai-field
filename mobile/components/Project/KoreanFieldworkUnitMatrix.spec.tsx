import { fireEvent, render } from '@testing-library/react-native';
import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkUnitMatrix from './KoreanFieldworkUnitMatrix';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkUnitMatrix', () => {
  it('renders a tablet unit matrix and opens records from the open action', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const handleOpenDocument = jest.fn();

    const { getByTestId, getByText } = render(
      <KoreanFieldworkUnitMatrix
        summary={createSummary()}
        documents={[operation]}
        onOpenDocument={handleOpenDocument}
        onAddDocumentOfCategory={jest.fn()}
      />
    );

    expect(getByText('조사 흐름표')).toBeTruthy();
    expect(getByText('조사구역 1')).toBeTruthy();

    fireEvent.press(getByTestId('unitMatrixOpen_operation-1'));

    expect(handleOpenDocument).toHaveBeenCalledWith(operation);
  });

  it('creates child records and photo evidence from matrix actions', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      liesWithin: ['operation-1'],
    });
    const handleAddDocumentOfCategory = jest.fn();

    const { getByTestId } = render(
      <KoreanFieldworkUnitMatrix
        summary={createSummary()}
        documents={[operation, feature]}
        onOpenDocument={jest.fn()}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
      />
    );

    fireEvent.press(getByTestId('unitMatrixAddChild_operation-1'));
    fireEvent.press(getByTestId('unitMatrixAddPhoto_feature-1'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(
      operation,
      C.TRENCH
    );
    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(
      feature,
      C.PHOTO
    );
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

const createSummary = (): KoreanFieldworkTodaySummary => ({
  dailyLogs: [],
  surveyBoundaries: [],
  featureCandidates: [],
  openIssues: [],
  issueCountByDocumentId: {},
});
