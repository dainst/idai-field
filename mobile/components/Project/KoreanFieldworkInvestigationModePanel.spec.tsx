import {
  fireEvent,
  render,
} from '@testing-library/react-native';
import React from 'react';
import KoreanFieldworkInvestigationModePanel from './KoreanFieldworkInvestigationModePanel';

describe('KoreanFieldworkInvestigationModePanel', () => {
  it('asks for the project investigation mode before showing setup requirements', () => {
    const onSelectMode = jest.fn();
    const onOpenMap = jest.fn();
    const { getByTestId, getByText, toJSON } = render(
      <KoreanFieldworkInvestigationModePanel
        onSelectMode={onSelectMode}
        onOpenMap={onOpenMap}
      />
    );

    expect(getByText('프로젝트 조사 방식을 정하세요')).toBeTruthy();
    expect(getByText('조사 방식과 조사 경계는 프로젝트 초기에 정하는 기본값입니다.')).toBeTruthy();
    expect(getByText('프로젝트 시작 체크')).toBeTruthy();
    expect(getByText('조사 방식')).toBeTruthy();
    expect(getByText('선택 필요')).toBeTruthy();
    expectSetupStepOrder(toJSON(), [
      'setupStep_mode',
      'setupStep_boundary',
      'setupStep_operation',
    ]);
    expect(getByText('다음: 프로젝트 조사 방식을 먼저 고르세요.')).toBeTruthy();
    expect(getByText('지도에서 조사 경계 생성')).toBeTruthy();

    fireEvent.press(getByTestId('investigationModeOpenMap'));
    expect(onOpenMap).toHaveBeenCalled();

    fireEvent.press(getByTestId('investigationMode_excavation'));

    expect(onSelectMode).toHaveBeenCalledWith('excavation');
  });

  it('shows mode-specific requirements after selection', () => {
    const onSelectMode = jest.fn();
    const {
      getAllByText,
      getByTestId,
      getByText,
      queryByTestId,
      queryByText,
      toJSON,
    } = render(
      <KoreanFieldworkInvestigationModePanel
        modeId="trialTrench"
        onSelectMode={onSelectMode}
        operationCount={1}
        surveyBoundaryCount={1}
      />
    );

    expect(getAllByText('표본·시굴조사').length).toBeGreaterThan(0);
    expect(queryByTestId('investigationMode_excavation')).toBeNull();
    expect(getByText('기본 확인 항목')).toBeTruthy();
    expect(getByText('6개 항목 · 필요할 때만 펼쳐 확인')).toBeTruthy();
    expect(queryByText('토층 정리 여부')).toBeNull();

    fireEvent.press(getByTestId('investigationModeToggleRequirements'));

    expect(getByText('토층 정리 여부')).toBeTruthy();
    expect(getByText('피트 조사와 피트 토층도')).toBeTruthy();
    expect(getAllByText('1건 기록됨').length).toBeGreaterThanOrEqual(1);
    expect(getByText('1건 시작됨')).toBeTruthy();
    expectSetupStepOrder(toJSON(), [
      'setupStep_mode',
      'setupStep_boundary',
      'setupStep_operation',
    ]);
    expect(getByText('시작 준비 완료. 이제 현장 기록을 추가하면 됩니다.')).toBeTruthy();

    fireEvent.press(getByTestId('investigationModeToggleChoices'));
    fireEvent.press(getByTestId('investigationMode_excavation'));

    expect(onSelectMode).toHaveBeenCalledWith('excavation');
  });

  it('shows the initial boundary summary before a map boundary record exists', () => {
    const onOpenMap = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkInvestigationModePanel
        modeId="excavation"
        onSelectMode={jest.fn()}
        operationCount={1}
        surveyBoundaryCount={0}
        boundarySummary="1구역 북쪽 능선부터 남쪽 농로까지"
        onOpenMap={onOpenMap}
      />
    );

    expect(getByText('1구역 북쪽 능선부터 남쪽 농로까지')).toBeTruthy();
    expect(getByText('지도 기록 필요')).toBeTruthy();
    expect(getByText('지도에 경계 기록 남기기')).toBeTruthy();
    expect(getByText('시작 가능. 지도에 조사 경계 도형을 남기면 경계 확인까지 끝납니다.')).toBeTruthy();

    fireEvent.press(getByTestId('investigationModeOpenMap'));
    expect(onOpenMap).toHaveBeenCalled();
  });

  it('points to the boundary step after the first operation exists', () => {
    const { getByText } = render(
      <KoreanFieldworkInvestigationModePanel
        modeId="excavation"
        onSelectMode={jest.fn()}
        operationCount={1}
        surveyBoundaryCount={0}
        onOpenMap={jest.fn()}
      />
    );

    expect(getByText('지도에 경계 기록 남기기')).toBeTruthy();
    expect(getByText('다음: 조사 경계 기준을 정하거나 지도에 경계를 남기세요.')).toBeTruthy();
  });

  it('treats legacy projects with records but no operation as organization work', () => {
    const { getByText } = render(
      <KoreanFieldworkInvestigationModePanel
        modeId="trialTrench"
        onSelectMode={jest.fn()}
        operationCount={0}
        totalDocumentCount={10}
        legacyRootDocumentCount={2}
        surveyBoundaryCount={0}
        onOpenMap={jest.fn()}
      />
    );

    expect(getByText('기존 기록 10건은 유지하고 조사 경계 기준만 새로 잡습니다.')).toBeTruthy();
    expect(getByText('기존 기록 2건 유지')).toBeTruthy();
    expect(getByText('지도에서 조사 경계 생성')).toBeTruthy();
    expect(getByText('다음: 지도에서 조사 경계를 생성하세요. 기존 기록은 유지됩니다.')).toBeTruthy();
  });
});

const expectSetupStepOrder = (
  tree: unknown,
  testIds: string[]
) => {
  const serialized = JSON.stringify(tree);
  const indexes = testIds.map((testId) => serialized.indexOf(testId));

  indexes.forEach((index) => expect(index).toBeGreaterThanOrEqual(0));
  expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
};
