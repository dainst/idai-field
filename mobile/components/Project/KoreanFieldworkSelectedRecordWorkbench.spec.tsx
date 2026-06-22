import { fireEvent, render } from '@testing-library/react-native';
import { Document } from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkSelectedRecordWorkbench from './KoreanFieldworkSelectedRecordWorkbench';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkSelectedRecordWorkbench', () => {
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
    onAddChild={jest.fn()}
    onAddDocumentOfCategory={jest.fn()}
    onClearSelection={jest.fn()}
    onEditDocument={jest.fn()}
    onOpenDocument={jest.fn()}
    onOpenMapDocument={jest.fn()}
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
