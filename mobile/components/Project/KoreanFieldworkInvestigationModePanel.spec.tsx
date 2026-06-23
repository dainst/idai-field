import {
  fireEvent,
  render,
} from '@testing-library/react-native';
import React from 'react';
import KoreanFieldworkInvestigationModePanel from './KoreanFieldworkInvestigationModePanel';

describe('KoreanFieldworkInvestigationModePanel', () => {
  it('asks for the investigation mode before showing fieldwork requirements', () => {
    const onSelectMode = jest.fn();
    const { getByTestId, getByText } = render(
      <KoreanFieldworkInvestigationModePanel onSelectMode={onSelectMode} />
    );

    expect(getByText('오늘 어떤 조사를 하나요?')).toBeTruthy();

    fireEvent.press(getByTestId('investigationMode_excavation'));

    expect(onSelectMode).toHaveBeenCalledWith('excavation');
  });

  it('shows mode-specific requirements after selection', () => {
    const { getAllByText, getByText } = render(
      <KoreanFieldworkInvestigationModePanel
        modeId="trialTrench"
        onSelectMode={jest.fn()}
      />
    );

    expect(getAllByText('표본·시굴조사').length).toBeGreaterThan(0);
    expect(getByText('토층 정리 여부')).toBeTruthy();
    expect(getByText('피트 조사와 피트 토층도')).toBeTruthy();
  });
});
