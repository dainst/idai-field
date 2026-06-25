import { fireEvent, render } from '@testing-library/react-native';
import { Document } from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkSelectedRecordWorkbench from './KoreanFieldworkSelectedRecordWorkbench';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkSelectedRecordWorkbench', () => {
  it('keeps related details collapsed until requested', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleToggleExpanded = jest.fn();

    const { getByTestId, queryByTestId } = renderWorkbench(feature, {
      isExpanded: false,
      onToggleExpanded: handleToggleExpanded,
    });

    expect(queryByTestId('evidenceMetric_photos')).toBeNull();

    fireEvent.press(getByTestId('selectedRecordToggleDetails'));

    expect(handleToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it('runs selected record commands from the tablet workbench', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleAddChild = jest.fn();
    const handleClearSelection = jest.fn();
    const handleEditDocument = jest.fn();
    const handleOpenMapDocument = jest.fn();

    const { getByTestId } = renderWorkbench(feature, {
      onAddChild: handleAddChild,
      onClearSelection: handleClearSelection,
      onEditDocument: handleEditDocument,
      onOpenMapDocument: handleOpenMapDocument,
    });

    fireEvent.press(getByTestId('selectedRecordOpenMap'));
    fireEvent.press(getByTestId('selectedRecordEdit'));
    fireEvent.press(getByTestId('selectedRecordAddChild'));
    fireEvent.press(getByTestId('selectedRecordClear'));

    expect(handleOpenMapDocument).toHaveBeenCalledWith(feature);
    expect(handleEditDocument).toHaveBeenCalledWith(feature);
    expect(handleAddChild).toHaveBeenCalledWith(feature);
    expect(handleClearSelection).toHaveBeenCalledTimes(1);
  });

  it('shows compact field status chips in the selected workbench header', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      featureType: 'pit',
      longAxisOrientation: 'n-23도-e',
      orientationReference: '자북',
    });

    const { getAllByText, getByTestId, getByText } = renderWorkbench(feature);

    expect(getByTestId('selectedRecordStatusChips')).toBeTruthy();
    expect(getAllByText('수혈').length).toBeGreaterThan(0);
    expect(getAllByText('장축 N-23°-E · 자북').length).toBeGreaterThan(0);
  });

  it('creates missing evidence records from the selected workbench', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleAddDocumentOfCategory = jest.fn();

    const { getByTestId } = renderWorkbench(feature, {
      allowedAddCategoryNames: [C.PHOTO],
      onAddDocumentOfCategory: handleAddDocumentOfCategory,
    });

    fireEvent.press(getByTestId('evidenceMetric_photos'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(feature, C.PHOTO);
  });

  it('updates current record fields from issue resolution controls', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1', {
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: ['measuredDrawingCompleted'],
    });
    const handleUpdateResourceFields = jest.fn();

    const { getByTestId } = renderWorkbench(feature, {
      onUpdateResourceFields: handleUpdateResourceFields,
    });

    fireEvent.press(getByTestId(
      'issueResolution_feature-complete-photo_feature-1'
    ));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith(feature, {
      featureInvestigationChecklist: [
        'measuredDrawingCompleted',
        'completionPhotoTaken',
      ],
    });
  });

  it('applies a later report identifier while preserving the field number', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 17');
    const handleUpdateResourceFields = jest.fn();

    const { getAllByText, getByTestId, getByText } = renderWorkbench(feature, {
      onUpdateResourceFields: handleUpdateResourceFields,
    });

    expect(getByText('번호 정리')).toBeTruthy();
    expect(getAllByText('수혈 17').length).toBeGreaterThanOrEqual(2);

    fireEvent.changeText(
      getByTestId('identifierRevisionNextInput'),
      '조선시대 3호 수혈'
    );
    fireEvent.changeText(
      getByTestId('identifierRevisionReasonInput'),
      '전면 제토 후 번호 재배정'
    );
    fireEvent.press(getByTestId('selectedRecordApplyIdentifierRevision'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith(feature, expect.objectContaining({
      identifier: '조선시대 3호 수혈',
      fieldIdentifier: '수혈 17',
      reportIdentifier: '조선시대 3호 수혈',
      identifierRevisionNote: '전면 제토 후 번호 재배정',
    }));
    expect(handleUpdateResourceFields.mock.calls[0][1].identifierRevisionHistory)
      .toEqual([
        expect.objectContaining({
          previousIdentifier: '수혈 17',
          nextIdentifier: '조선시대 3호 수혈',
          fieldIdentifier: '수혈 17',
          reason: '전면 제토 후 번호 재배정',
        }),
      ]);
  });

  it('does not show identifier revision controls for trench records', () => {
    const trench = createDoc('trench-1', C.TRENCH, 'T1');

    const { queryByTestId } = renderWorkbench(trench);

    expect(queryByTestId('identifierRevisionPanel')).toBeNull();
  });
});

const renderWorkbench = (
  document: Document,
  overrides: Partial<React.ComponentProps<
    typeof KoreanFieldworkSelectedRecordWorkbench
  >> = {}
) => render(
  <KoreanFieldworkSelectedRecordWorkbench
    document={document}
    documents={[document]}
    allowedAddCategoryNames={[]}
    isExpanded={true}
    onAddChild={jest.fn()}
    onAddDocumentOfCategory={jest.fn()}
    onClearSelection={jest.fn()}
    onEditDocument={jest.fn()}
    onOpenDocument={jest.fn()}
    onOpenMapDocument={jest.fn()}
    onToggleExpanded={jest.fn()}
    onUpdateResourceFields={jest.fn()}
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
