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

  it('resolves current record checklist issues from the context panel', () => {
    const feature = createDoc('feature-1', C.FEATURE, '유구 1', {}, {
      featureRecordingStatus: 'confirmed',
      featureInvestigationChecklist: ['measuredDrawingCompleted'],
    });
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId } = render(
      <KoreanFieldworkRecordContextPanel
        document={feature}
        documents={[feature]}
        allowedAddCategoryNames={[]}
        onOpenDocument={jest.fn()}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    fireEvent.press(getByTestId(
      'issueResolution_feature-complete-photo_feature-1'
    ));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      featureInvestigationChecklist: [
        'measuredDrawingCompleted',
        'completionPhotoTaken',
      ],
    });
  });

  it('starts missing soil profile photo records from a readiness issue', () => {
    const feature = createDoc('feature-1', C.FEATURE, '유구 1', {}, {
      featureSoilProfilePhotoCount: 1,
      featureInvestigationChecklist: ['soilProfilePhotoLinked'],
    });
    const handleAddDocumentOfCategory = jest.fn();
    const { getByTestId } = render(
      <KoreanFieldworkRecordContextPanel
        document={feature}
        documents={[feature]}
        allowedAddCategoryNames={[C.SOIL_PROFILE_PHOTO]}
        onAddDocumentOfCategory={handleAddDocumentOfCategory}
        onOpenDocument={jest.fn()}
        onUpdateResourceFields={jest.fn()}
      />
    );

    fireEvent.press(getByTestId(
      'issueResolution_soil-profile-photo-count_feature-1'
    ));

    expect(handleAddDocumentOfCategory)
      .toHaveBeenCalledWith(feature, C.SOIL_PROFILE_PHOTO);
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
} as any);
