import { fireEvent, render } from '@testing-library/react-native';
import { CategoryForm, NewResource } from 'idai-field-core';
import React from 'react';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import KoreanFieldworkDraftPresetPanel from './KoreanFieldworkDraftPresetPanel';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkDraftPresetPanel', () => {
  it('applies a selected preset to the draft resource', () => {
    const handleApplyPreset = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkDraftPresetPanel
        category={createCategoryForm([
          'featureRecordingStatus',
          'recordCreationTiming',
          'fieldRecordQuality',
          'verificationState',
        ])}
        resource={createResource(C.FEATURE)}
        onApplyPreset={handleApplyPreset}
      />
    );

    expect(getByText('기록 템플릿')).toBeTruthy();

    fireEvent.press(getByTestId('draftPreset_feature-investigation'));

    expect(handleApplyPreset).toHaveBeenCalledWith({
      featureRecordingStatus: 'investigating',
      recordCreationTiming: 'duringFieldwork',
      fieldRecordQuality: ['immediateRecording'],
      verificationState: 'observedInField',
    });
  });
});

const createCategoryForm = (fieldNames: string[]): CategoryForm => ({
  groups: [
    {
      name: 'fieldwork',
      fields: fieldNames.map((name) => ({ name })),
    },
  ],
} as CategoryForm);

const createResource = (category: string): NewResource => ({
  identifier: `${category}-1`,
  category,
  relations: {},
});
