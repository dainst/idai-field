import { fireEvent, render } from '@testing-library/react-native';
import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import React from 'react';
import KoreanFieldworkProgressBoard from './KoreanFieldworkProgressBoard';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkProgressBoard', () => {
  it('renders field progress cards and runs the next tablet action', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
      fieldRecordQuality: [],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });
    const handleAddDocumentOfCategory = jest.fn();

    const { getByTestId, getByText } = render(
      <KoreanFieldworkProgressBoard
        summary={createSummary()}
        documents={[operation]}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onOpenDocument={jest.fn()}
      />
    );

    expect(getByText('현장 진행표')).toBeTruthy();
    expect(getByText('착수')).toBeTruthy();
    expect(getByText('트렌치 추가')).toBeTruthy();

    fireEvent.press(getByTestId('progressAction_operation-1'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(
      operation,
      C.TRENCH
    );
  });

  it('runs excavation progress from the operation into a feature record', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
      fieldRecordQuality: [],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });
    const handleAddDocumentOfCategory = jest.fn();

    const { getByTestId, getByText } = render(
      <KoreanFieldworkProgressBoard
        summary={createSummary()}
        documents={[operation]}
        investigationModeId="excavation"
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onOpenDocument={jest.fn()}
      />
    );

    expect(getByText('유구 기록')).toBeTruthy();

    fireEvent.press(getByTestId('progressAction_operation-1'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(
      operation,
      C.FEATURE
    );
  });

  it('opens the record when a progress card is pressed', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {}, {
      featureRecordingStatus: 'candidate',
      featureInvestigationChecklist: [],
    });
    const handleOpenDocument = jest.fn();

    const { getByTestId } = render(
      <KoreanFieldworkProgressBoard
        summary={createSummary()}
        documents={[feature]}
        onOpenDocument={handleOpenDocument}
      />
    );

    fireEvent.press(getByTestId('progressItem_feature-1'));

    expect(handleOpenDocument).toHaveBeenCalledWith(feature);
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
