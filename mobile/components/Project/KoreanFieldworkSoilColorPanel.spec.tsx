import { fireEvent, render } from '@testing-library/react-native';
import {
  CategoryForm,
  Resource,
} from 'idai-field-core';
import React from 'react';
import KoreanFieldworkSoilColorPanel from './KoreanFieldworkSoilColorPanel';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('KoreanFieldworkSoilColorPanel', () => {
  it('records manual Munsell values for layer records', () => {
    const handleUpdateResourceField = jest.fn();
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkSoilColorPanel
        category={createCategoryForm([
          'soilColorMunsellManual',
          'soilColorMoistureState',
          'soilColorCaptureCondition',
          'soilColorAssistStatus',
          'soilColorNote',
        ])}
        resource={createResource(C.LAYER, {
          soilColorMunsellManual: '',
          soilColorMoistureState: '',
          soilColorCaptureCondition: '',
          soilColorAssistStatus: 'notRun',
          soilColorNote: '',
        })}
        onUpdateResourceField={handleUpdateResourceField}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    expect(getByText('토색 빠른 기록')).toBeTruthy();
    expect(getByText('먼셀값')).toBeTruthy();
    expect(getByText('수분 상태')).toBeTruthy();

    fireEvent.press(getByTestId('soilColorOption_10YR 4/3'));
    fireEvent.press(getByTestId('soilColorOption_moist'));
    fireEvent.press(getByTestId('soilColorOption_calibrationTargetUsed'));
    fireEvent.changeText(getByTestId('soilColorInput_note'), '회갈색 사질토');

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      soilColorMunsellManual: '10YR 4/3',
      soilColorAssistStatus: 'manualRecorded',
    });
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      1,
      'soilColorMoistureState',
      'moist'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      2,
      'soilColorCaptureCondition',
      'calibrationTargetUsed'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      3,
      'soilColorNote',
      '회갈색 사질토'
    );
  });

  it('records numbered soil colors for soil profile photo records', () => {
    const handleUpdateResourceField = jest.fn();
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkSoilColorPanel
        category={createCategoryForm([
          'soilProfileColorSwatches',
          'soilColorCaptureCondition',
          'soilProfileColorNote',
          'soilProfileCaptureNote',
        ])}
        resource={createResource(C.SOIL_PROFILE_PHOTO, {
          soilProfileColorSwatches: '1: 10YR 4/3',
          soilColorCaptureCondition: '',
          soilProfileColorNote: '',
          soilProfileCaptureNote: '',
        })}
        onUpdateResourceField={handleUpdateResourceField}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    expect(getByText('토색 빠른 기록')).toBeTruthy();
    expect(getByText('사진 메모')).toBeTruthy();

    fireEvent.press(getByTestId('soilColorOption_10YR 3/2'));
    fireEvent.changeText(
      getByTestId('soilColorInput_profileColorSwatches'),
      '1: 10YR 4/3 갈색\n2: 10YR 3/2 암회갈색'
    );
    fireEvent.press(getByTestId('soilColorOption_shade'));
    fireEvent.changeText(getByTestId('soilColorInput_note'), '2번은 습윤 상태');
    fireEvent.changeText(getByTestId('soilColorInput_captureNote'), '북벽, 그늘');

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      soilProfileColorSwatches: '1: 10YR 4/3\n2: 10YR 3/2',
    });
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      1,
      'soilProfileColorSwatches',
      '1: 10YR 4/3 갈색\n2: 10YR 3/2 암회갈색'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      2,
      'soilColorCaptureCondition',
      'shade'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      3,
      'soilProfileColorNote',
      '2번은 습윤 상태'
    );
    expect(handleUpdateResourceField).toHaveBeenNthCalledWith(
      4,
      'soilProfileCaptureNote',
      '북벽, 그늘'
    );
  });

  it('lets users accept photo-derived Munsell candidates', () => {
    const handleUpdateResourceField = jest.fn();
    const handleUpdateResourceFields = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkSoilColorPanel
        category={createCategoryForm([
          'soilProfileColorSwatches',
          'soilColorAssistCandidates',
          'soilColorAssistStatus',
        ])}
        resource={createResource(C.SOIL_PROFILE_PHOTO, {
          soilProfileColorSwatches: '',
          soilColorAssistCandidates:
            '사진 중앙부 평균 RGB 111/87/61\n1: 10YR 4/3 (보통, 차이 0.0)',
          soilColorAssistStatus: 'candidatesAvailable',
        })}
        onUpdateResourceField={handleUpdateResourceField}
        onUpdateResourceFields={handleUpdateResourceFields}
      />
    );

    expect(getByText('사진 판독 후보')).toBeTruthy();
    fireEvent.press(getByTestId('soilColorCandidateOption_10YR 4/3'));
    fireEvent.changeText(
      getByTestId('soilColorInput_assistCandidates'),
      '1: 10YR 3/2'
    );
    fireEvent.changeText(
      getByTestId('soilColorInput_assistCandidates'),
      ''
    );

    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      soilProfileColorSwatches: '1: 10YR 4/3',
      soilColorAssistStatus: 'reviewed',
    });
    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      soilColorAssistCandidates: '1: 10YR 3/2',
      soilColorAssistStatus: 'candidatesAvailable',
    });
    expect(handleUpdateResourceFields).toHaveBeenCalledWith({
      soilColorAssistCandidates: '',
      soilColorAssistStatus: 'notRun',
    });
  });

  it('does not render outside soil color record categories', () => {
    const { queryByTestId } = render(
      <KoreanFieldworkSoilColorPanel
        category={createCategoryForm(['soilColorMunsellManual'])}
        resource={createResource(C.FEATURE)}
        onUpdateResourceField={jest.fn()}
      />
    );

    expect(queryByTestId('koreanFieldworkSoilColorPanel')).toBeNull();
  });
});

const createCategoryForm = (fieldNames: string[]): CategoryForm => ({
  groups: [
    {
      name: 'koreanFieldwork',
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
