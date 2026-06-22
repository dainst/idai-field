import { fireEvent, render } from '@testing-library/react-native';
import {
  CategoryForm,
  Resource,
} from 'idai-field-core';
import React from 'react';
import KoreanFieldworkQuickRecordPanel from './KoreanFieldworkQuickRecordPanel';
import {
  FIELDWORK_QUICK_FIELDS,
} from './korean-fieldwork-quick-record';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkQuickRecordPanel', () => {
  it('renders fieldwork quick checks and updates multi-value fields', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.checklist,
          FIELDWORK_QUICK_FIELDS.featureStatus,
          FIELDWORK_QUICK_FIELDS.quality,
          FIELDWORK_QUICK_FIELDS.verification,
          FIELDWORK_QUICK_FIELDS.timing,
        ])}
        resource={createResource(C.FEATURE, {
          featureRecordingStatus: 'candidate',
          featureInvestigationChecklist: ['preInvestigationPhotoTaken'],
          fieldRecordQuality: [],
          verificationState: 'pendingDecision',
          recordCreationTiming: 'duringFieldwork',
        })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('현장 빠른 입력')).toBeTruthy();
    expect(getByText('유구 진행')).toBeTruthy();
    expect(getByText('조사 과정표')).toBeTruthy();
    expect(getByText('품질 확인')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_investigating'));
    fireEvent.press(getByTestId('quickRecordOption_completionPhotoTaken'));
    fireEvent.press(getByTestId('quickRecordOption_immediateRecording'));

    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      1,
      FIELDWORK_QUICK_FIELDS.featureStatus,
      'investigating'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      2,
      FIELDWORK_QUICK_FIELDS.checklist,
      ['preInvestigationPhotoTaken', 'completionPhotoTaken']
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      3,
      FIELDWORK_QUICK_FIELDS.quality,
      ['immediateRecording']
    );
  });

  it('applies fieldwork workflow presets as a batch update', () => {
    const handleUpdateResourceField = jest.fn();
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.checklist,
          FIELDWORK_QUICK_FIELDS.featureStatus,
          FIELDWORK_QUICK_FIELDS.quality,
          FIELDWORK_QUICK_FIELDS.verification,
          FIELDWORK_QUICK_FIELDS.timing,
        ])}
        resource={createResource(C.FEATURE, {
          featureRecordingStatus: 'candidate',
          featureInvestigationChecklist: ['preInvestigationPhotoTaken'],
          fieldRecordQuality: [],
          verificationState: 'pendingDecision',
          recordCreationTiming: '',
        })}
        onUpdateResourceField={handleUpdateResourceField}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    fireEvent.press(getByTestId('quickRecordPreset_startFeatureInvestigation'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      featureRecordingStatus: 'investigating',
      featureInvestigationChecklist: [
        'preInvestigationPhotoTaken',
        'inProgressPhotoTaken',
      ],
      fieldRecordQuality: ['immediateRecording'],
      recordCreationTiming: 'duringFieldwork',
      verificationState: 'observedInField',
    });
    expect(handleUpdateResourceField).not.toHaveBeenCalled();
  });

  it('updates single-choice verification and timing fields directly', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.verification,
          FIELDWORK_QUICK_FIELDS.timing,
        ])}
        resource={createResource(C.TRENCH, {
          verificationState: 'pendingDecision',
          recordCreationTiming: 'duringFieldwork',
        })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    fireEvent.press(getByTestId('quickRecordOption_observedInField'));
    fireEvent.press(getByTestId('quickRecordOption_sameDayFieldRecord'));

    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      1,
      FIELDWORK_QUICK_FIELDS.verification,
      'observedInField'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      2,
      FIELDWORK_QUICK_FIELDS.timing,
      'sameDayFieldRecord'
    );
  });

  it('does not render when the category form has no supported quick fields', () => {
    const { queryByTestId } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm(['shortDescription'])}
        resource={createResource(C.FEATURE)}
        onUpdateResourceField={jest.fn()}
      />
    );

    expect(queryByTestId('koreanFieldworkQuickRecordPanel')).toBeNull();
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

const createResource = (
  category: string,
  extraResource: Record<string, unknown> = {}
): Resource => ({
  id: 'resource-1',
  identifier: '기록 1',
  category,
  relations: {},
  ...extraResource,
} as unknown as Resource);
