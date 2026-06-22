import { fireEvent, render } from '@testing-library/react-native';
import { Document } from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkRecordActionPanel from './KoreanFieldworkRecordActionPanel';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkRecordActionPanel', () => {
  it('creates the recommended next child record from the edit header', () => {
    const operation = createDoc('operation-1', C.OPERATION, '조사구역 1');
    const handleAddDocumentOfCategory = jest.fn();

    const { getByTestId, getByText } = render(
      <KoreanFieldworkRecordActionPanel
        document={operation}
        documents={[operation]}
        allowedAddCategoryNames={[C.TRENCH, C.PHOTO]}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onOpenDocument={jest.fn()}
      />
    );

    expect(getByText('현장 작업')).toBeTruthy();

    fireEvent.press(getByTestId('recordAction_create-Trench'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(
      operation,
      C.TRENCH
    );
  });

  it('opens existing evidence from the action rail', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const photo = createDoc('photo-1', C.PHOTO, '수혈 1 사진', {
      depicts: ['feature-1'],
    });
    const handleOpenDocument = jest.fn();

    const { getByTestId } = render(
      <KoreanFieldworkRecordActionPanel
        document={feature}
        documents={[feature, photo]}
        allowedAddCategoryNames={[]}
        onAddDocumentOfCategory={jest.fn()}
        onOpenDocument={handleOpenDocument}
      />
    );

    fireEvent.press(getByTestId('recordAction_open-photos'));

    expect(handleOpenDocument).toHaveBeenCalledWith(photo);
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {}
): Document => ({
  _id: id,
  created: { user: 'test', date: new Date('2026-06-23T00:00:00.000Z') },
  modified: [],
  resource: {
    id,
    identifier,
    category,
    relations,
  },
});
