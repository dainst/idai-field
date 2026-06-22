import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import KoreanFieldworkRecordContextPanel from './KoreanFieldworkRecordContextPanel';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkRecordContextPanel', () => {
  it('creates missing allowed evidence from the current fieldwork record', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleAddDocumentOfCategory = jest.fn();
    const handleOpenDocument = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkRecordContextPanel
        document={feature}
        documents={[feature]}
        allowedAddCategoryNames={[C.PHOTO]}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onOpenDocument={handleOpenDocument}
      />
    );

    expect(getByText('추가')).toBeTruthy();
    fireEvent.press(getByTestId('evidenceMetric_photos'));

    expect(handleAddDocumentOfCategory).toHaveBeenCalledWith(feature, C.PHOTO);
    expect(handleOpenDocument).not.toHaveBeenCalled();
  });

  it('opens existing linked evidence instead of creating a duplicate record', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const photo = createDoc('photo-1', C.PHOTO, '수혈 1 조사 중 사진', {
      depicts: ['feature-1'],
    });
    const handleAddDocumentOfCategory = jest.fn();
    const handleOpenDocument = jest.fn();
    const { getByTestId, queryByText } = render(
      <KoreanFieldworkRecordContextPanel
        document={feature}
        documents={[feature, photo]}
        allowedAddCategoryNames={[C.PHOTO]}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onOpenDocument={handleOpenDocument}
      />
    );

    expect(queryByText('추가')).toBeNull();
    fireEvent.press(getByTestId('evidenceMetric_photos'));

    expect(handleOpenDocument).toHaveBeenCalledWith(photo);
    expect(handleAddDocumentOfCategory).not.toHaveBeenCalled();
  });

  it('does not turn missing evidence into an add action when the category is not allowed', () => {
    const feature = createDoc('feature-1', C.FEATURE, '수혈 1');
    const handleAddDocumentOfCategory = jest.fn();
    const { getByTestId, queryByText } = render(
      <KoreanFieldworkRecordContextPanel
        document={feature}
        documents={[feature]}
        allowedAddCategoryNames={[]}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onOpenDocument={jest.fn()}
      />
    );

    const photoMetric = getByTestId('evidenceMetric_photos');

    expect(queryByText('추가')).toBeNull();
    fireEvent.press(photoMetric);

    expect(handleAddDocumentOfCategory).not.toHaveBeenCalled();
  });
});

const createDoc = (
  id: string,
  category: string,
  identifier: string,
  relations: Record<string, string[]> = {}
) => ({
  resource: {
    id,
    identifier,
    category,
    relations,
  },
} as any);
