import { fireEvent, render } from '@testing-library/react-native';
import {
  KoreanFieldworkReadinessIssue,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import React from 'react';
import KoreanFieldworkWorkbenchPanel from './KoreanFieldworkWorkbenchPanel';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkWorkbenchPanel', () => {
  it('renders actionable tablet workbench records and opens the edit screen', () => {
    const handleEditDocument = jest.fn();
    const documents = [
      createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
        fieldRecordQuality: ['immediateRecording'],
        recordCreationTiming: 'duringFieldwork',
      }),
      createDoc('feature-1', C.FEATURE, '수혈 1', {
        liesWithin: ['operation-1'],
      }, {
        featureRecordingStatus: 'candidate',
        featureInvestigationChecklist: [],
        fieldRecordQuality: [],
        verificationState: 'pendingDecision',
      }),
    ];

    const { getAllByText, getByTestId, getByText } = render(
      <KoreanFieldworkWorkbenchPanel
        summary={createSummary([createIssue('feature-1')])}
        documents={documents as any}
        onEditDocument={handleEditDocument}
      />
    );

    expect(getByText('현장 작업대')).toBeTruthy();
    expect(getByText('수혈 1')).toBeTruthy();
    expect(getAllByText('검출 유구').length).toBeGreaterThan(0);

    fireEvent.press(getByTestId('workbenchItem_feature-1'));

    expect(handleEditDocument).toHaveBeenCalledWith('feature-1', C.FEATURE);
  });

  it('starts recommended evidence records from workbench cards', () => {
    const handleEditDocument = jest.fn();
    const handleAddDocumentOfCategory = jest.fn();
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {}, {
      featureRecordingStatus: 'candidate',
      featureInvestigationChecklist: [],
      fieldRecordQuality: [],
      verificationState: 'candidate',
    });
    const { getByTestId, getByText } = render(
      <KoreanFieldworkWorkbenchPanel
        documents={[feature] as any}
        getAllowedAddCategoryNames={() => [C.PHOTO]}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onEditDocument={handleEditDocument}
        summary={createSummary([])}
      />
    );

    expect(getByText('사진 추가')).toBeTruthy();
    fireEvent.press(getByTestId('workbenchAction_feature-1_create-photos'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(feature, C.PHOTO);
    expect(handleEditDocument).not.toHaveBeenCalled();
  });

  it('does not render when every record is already settled', () => {
    const { queryByTestId } = render(
      <KoreanFieldworkWorkbenchPanel
        summary={createSummary([])}
        documents={[
          createDoc('operation-1', C.OPERATION, '조사구역 1', {}, {
            fieldRecordQuality: ['immediateRecording'],
            recordCreationTiming: 'duringFieldwork',
            verificationState: 'observedInField',
          }),
        ] as any}
        onEditDocument={jest.fn()}
      />
    );

    expect(queryByTestId('koreanFieldworkWorkbenchPanel')).toBeNull();
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
});

const createSummary = (
  openIssues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkTodaySummary => ({
  dailyLogs: [],
  surveyBoundaries: [],
  featureCandidates: [],
  openIssues,
  issueCountByDocumentId: openIssues.reduce((index, issue) => {
    index[issue.documentId] = (index[issue.documentId] ?? 0) + 1;
    return index;
  }, {} as Record<string, number>),
});

const createIssue = (
  documentId: string
): KoreanFieldworkReadinessIssue => ({
  ruleId: 'test-rule',
  documentId,
  identifier: '수혈 1',
  category: C.FEATURE,
  severity: 'warning',
  message: '확인 필요',
  relatedFields: ['featureInvestigationChecklist'],
  recommendedAction: '현장에서 확인하세요.',
  blocksSave: false,
});
