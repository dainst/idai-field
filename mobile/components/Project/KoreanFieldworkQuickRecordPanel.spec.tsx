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
    const { getByTestId, getByText, queryByText } = render(
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

    expect(getByText('현장 최소 기록')).toBeTruthy();
    expect(getByText('조사 단계 확인')).toBeTruthy();
    expect(getByText('추가 상태값 보기 (4)')).toBeTruthy();
    expect(queryByText('유구 진행')).toBeNull();

    fireEvent.press(getByTestId('quickRecordToggleSecondaryFields'));

    expect(getByText('유구 진행')).toBeTruthy();
    expect(getByText('기록 구분')).toBeTruthy();
    expect(getByText('확인 상태')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_investigating'));
    fireEvent.press(getByTestId('quickRecordOption_completionPhotoTaken'));
    fireEvent.press(getByTestId('quickRecordOption_immediateRecording'));
    fireEvent.press(getByTestId('quickRecordOption_observedInField'));

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
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      4,
      FIELDWORK_QUICK_FIELDS.verification,
      'observedInField'
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
    expect(getByText('유구 성격별 기록')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_posthole'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      featureType: 'posthole',
      featureInterpretationType: ['other', 'posthole'],
    });
  });

  it('clears stale feature-specific attributes when the feature type changes', () => {
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.featureInterpretationType,
          'potteryKilnPartInvestigation',
          'potteryKilnStructureContext',
          'postholeGroupSurvey',
          'productionProcessSystem',
          'productionSiteAssociatedFacility',
        ])}
        resource={createResource(C.FEATURE, {
          featureType: 'kiln',
          featureInterpretationType: ['kiln'],
          potteryKilnPartInvestigation: ['combustionPartRecorded'],
          potteryKilnStructureContext: ['planShapeRecorded'],
          productionProcessSystem: ['rawMaterialProcurement'],
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    fireEvent.press(getByTestId('quickRecordOption_posthole'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      featureType: 'posthole',
      featureInterpretationType: ['posthole'],
      potteryKilnPartInvestigation: undefined,
      potteryKilnStructureContext: undefined,
      productionProcessSystem: undefined,
    });
  });

  it('shows feature-specific attributes after selecting a feature type', () => {
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.featureInterpretationType,
          'potteryKilnPartInvestigation',
          'potteryKilnStructureContext',
        ])}
        resource={createResource(C.FEATURE, {
          featureType: 'kiln',
          featureInterpretationType: ['kiln'],
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    expect(getByText('가마 핵심 속성')).toBeTruthy();
    expect(getByText('유구 성격별 기록')).toBeTruthy();
    expect(getByText('가마 부위')).toBeTruthy();
    expect(getByText('구조·피열')).toBeTruthy();
    expect(getByText('연소부')).toBeTruthy();
    expect(getByText('소성부')).toBeTruthy();
    expect(getByText('연도부')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_combustionPartRecorded'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      potteryKilnPartInvestigation: ['combustionPartRecorded'],
    });
  });

  it('shows production-specific attributes from the feature type choice', () => {
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.featureInterpretationType,
          'productionProcessSystem',
          'productionSiteAssociatedFacility',
        ])}
        resource={createResource(C.FEATURE, {
          featureType: 'production',
          featureInterpretationType: ['productionFeature'],
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    expect(getByText('생산유구')).toBeTruthy();
    expect(getByText('공정 체계')).toBeTruthy();
    expect(getByText('원료 채취')).toBeTruthy();
    expect(getByText('부속시설')).toBeTruthy();
    expect(getByText('채토장')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_rawMaterialProcurement'));

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      productionProcessSystem: ['rawMaterialProcurement'],
    });
  });

  it('shows linear feature attributes for ditch and fence records', () => {
    const { getByText, rerender } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.featureInterpretationType,
          'firstExposureRecord',
          'postholeGroupSurvey',
        ])}
        resource={createResource(C.FEATURE, {
          featureType: 'ditch',
          featureInterpretationType: ['ditchOrGully'],
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={jest.fn()}
      />
    );

    expect(getByText('구상유구')).toBeTruthy();
    expect(getByText('윤곽·단면')).toBeTruthy();
    expect(getByText('단면 대조')).toBeTruthy();

    rerender(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.featureInterpretationType,
          'firstExposureRecord',
          'postholeGroupSurvey',
        ])}
        resource={createResource(C.FEATURE, {
          featureType: 'fence',
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={jest.fn()}
      />
    );

    expect(getByText('목책열')).toBeTruthy();
    expect(getByText('목책열 조사')).toBeTruthy();
    expect(getByText('주간거리')).toBeTruthy();
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

    expect(getByText('시대/시기')).toBeTruthy();

    fireEvent.press(getByTestId('quickRecordOption_joseon'));

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      FIELDWORK_QUICK_FIELDS.period,
      'joseon'
    );
  });

  it('updates additional observation text inside the quick record flow', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.period,
          'description',
        ])}
        resource={createResource(C.FEATURE, {
          period: 'undated',
          description: '평면 윤곽 확인 중',
        })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('야장 메모')).toBeTruthy();

    fireEvent.changeText(
      getByTestId('quickRecordInput_description'),
      '연소부 동측 벽면에 소결 흔적 확인'
    );

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      'description',
      '연소부 동측 벽면에 소결 흔적 확인'
    );
  });

  it('uses feature-specific placeholders for additional observation text', () => {
    const { getByPlaceholderText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.featureInterpretationType,
          'description',
          'potteryKilnPartInvestigation',
          'potteryKilnStructureContext',
        ])}
        resource={createResource(C.FEATURE, {
          featureType: 'kiln',
          featureInterpretationType: ['kiln'],
          description: '',
        })}
        onUpdateResourceField={jest.fn()}
        onUpdateResourceFields={jest.fn()}
      />
    );

    expect(getByPlaceholderText(
      '가마 관찰 - 가마 부위: 화구, 연소부, 소성부, 연도부 / 구조·피열: 평면형, 규모, 소성·연소 비율, 화염 흐름 / 야장 근거: 평면·단면 스케치 번호, 약측값, 사진·도면 번호, 성격 미정/추정 사유'
    )).toBeTruthy();
  });

  it('updates the long-axis orientation field from quick input', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.longAxisOrientation,
          FIELDWORK_QUICK_FIELDS.orientationReference,
          FIELDWORK_QUICK_FIELDS.orientationNote,
        ])}
        resource={createResource(C.FEATURE, {
          longAxisOrientation: 'N-23°-E',
          orientationReference: '',
          orientationNote: '',
        })}
        onUpdateResourceField={handleUpdateResourceField}
        onUpdateResourceFields={(updates) =>
          Object.entries(updates).forEach(([fieldName, value]) =>
            handleUpdateResourceField(fieldName, value)
          )}
      />
    );

    expect(getByText('장축 방위')).toBeTruthy();
    expect(getByText('N-23°-E = 북에서 동쪽으로 23°')).toBeTruthy();
    expect(getByText('방위 메모')).toBeTruthy();
    expect(getByText('N-E')).toBeTruthy();

    fireEvent.changeText(
      getByTestId('quickRecordInput_longAxisOrientation'),
      'N-23°-E'
    );
    fireEvent.press(getByTestId('quickRecordOption_N-W'));
    fireEvent.changeText(
      getByTestId('quickRecordInput_orientationNote'),
      'GPS 나침반 기준, 재측정 필요'
    );

    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      1,
      FIELDWORK_QUICK_FIELDS.longAxisOrientation,
      'N-23°-E'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      2,
      FIELDWORK_QUICK_FIELDS.longAxisOrientation,
      'N-W'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      3,
      FIELDWORK_QUICK_FIELDS.orientationReference,
      '자북'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      4,
      FIELDWORK_QUICK_FIELDS.orientationNote,
      'GPS 나침반 기준, 재측정 필요'
    );
  });

  it('normalizes common long-axis orientation text on edit completion', () => {
    const handleUpdateResourceField = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.longAxisOrientation,
          FIELDWORK_QUICK_FIELDS.orientationReference,
        ])}
        resource={createResource(C.FEATURE, {
          longAxisOrientation: 'N-120°-E',
          orientationReference: '',
        })}
        onUpdateResourceField={handleUpdateResourceField}
      />
    );

    expect(getByText('자북 기준 예: N-E, N-23°-E, 북에서 동쪽으로 23도')).toBeTruthy();

    fireEvent(
      getByTestId('quickRecordInput_longAxisOrientation'),
      'endEditing',
      { nativeEvent: { text: '북 23도 동' } }
    );

    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      FIELDWORK_QUICK_FIELDS.longAxisOrientation,
      'N-23°-E'
    );
    expect(handleUpdateResourceField).toHaveBeenCalledWith(
      FIELDWORK_QUICK_FIELDS.orientationReference,
      '자북'
    );
  });

  it('shows the long-axis orientation explanation for the current value', () => {
    const { getByText } = render(
      <KoreanFieldworkQuickRecordPanel
        category={createCategoryForm([
          FIELDWORK_QUICK_FIELDS.longAxisOrientation,
        ])}
        resource={createResource(C.FEATURE, {
          longAxisOrientation: 'S-45°-W',
        })}
        onUpdateResourceField={jest.fn()}
      />
    );

    expect(getByText('S-45°-W = 남에서 서쪽으로 45°')).toBeTruthy();
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
        category={createCategoryForm(['legacyNote'])}
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
