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

    expect(getByText('필요할 때 입력')).toBeTruthy();
    expect(getByText('유구 진행')).toBeTruthy();
    expect(getByText('조사 흐름')).toBeTruthy();
    expect(getByText('기록 구분')).toBeTruthy();

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

  it('updates feature type and desktop interpretation fields together', () => {
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.featureInterpretationType,
        ])}
        resource={createResource(C.FEATURE, {
          featureType: 'unknown',
          featureInterpretationType: ['pitFeature', 'other'],
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    expect(getByText('유구 성격')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_posthole'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      featureType: 'posthole',
      featureInterpretationType: ['other', 'posthole'],
    });
  });

  it('updates the feature period from the optional quick setup', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.period,
        ])}
        resource={createResource(C.FEATURE, { period: 'undated' })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('시기')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_joseon'));

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      FIELDWORK_QUICK_FIELDS.period,
      'joseon'
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
    });
    expect(handleUpdateResourceField).not.toHaveBeenCalled();
  });

  it('renders mode-aware trench checklist options and preset values', () => {
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId, getByText, queryByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.checklist,
          FIELDWORK_QUICK_FIELDS.featureStatus,
          FIELDWORK_QUICK_FIELDS.quality,
          FIELDWORK_QUICK_FIELDS.timing,
        ])}
        investigationModeId="trialTrench"
        resource={createResource(C.FEATURE, {
          featureRecordingStatus: 'candidate',
          featureInvestigationChecklist: ['preInvestigationPhotoTaken'],
          fieldRecordQuality: [],
          recordCreationTiming: '',
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    expect(getByText('피트 토층도')).toBeTruthy();
    expect(queryByText('유물 수습')).toBeNull();

    fireEvent.press(getByTestId('quickRecordPreset_startFeatureInvestigation'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith(expect.objectContaining({
      featureInvestigationChecklist: [
        'preInvestigationPhotoTaken',
        'trenchSoilCleaned',
        'trenchFeatureChecked',
      ],
    }));
  });

  it('renders trial trench checklist controls for trench records', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.checklist,
          FIELDWORK_QUICK_FIELDS.timing,
        ])}
        investigationModeId="trialTrench"
        resource={createResource(C.TRENCH, {
          featureInvestigationChecklist: ['trenchSoilCleaned'],
          recordCreationTiming: 'duringFieldwork',
        })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('토층 정리')).toBeTruthy();
    expect(getByText('피트 토층도')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_trenchPitOpened'));

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      FIELDWORK_QUICK_FIELDS.checklist,
      ['trenchSoilCleaned', 'trenchPitOpened']
    );
  });

  it('does not show trench checklist controls outside trial trench mode', () => {
    const { queryByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.checklist,
          FIELDWORK_QUICK_FIELDS.timing,
        ])}
        investigationModeId="excavation"
        resource={createResource(C.TRENCH, {
          featureInvestigationChecklist: ['trenchSoilCleaned'],
          recordCreationTiming: 'duringFieldwork',
        })}
        onUpdateResourceField={jest.fn()}
      />
    );

    expect(queryByText('피트 토층도')).toBeNull();
  });

  it('updates the single-choice timing field directly', () => {
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

    fireEvent.press(getByTestId('quickRecordOption_sameDayFieldRecord'));

    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      1,
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
