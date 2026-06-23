import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import MapBottomSheet from './MapBottomSheet';
import { KOREAN_FIELDWORK_CATEGORIES } from '../korean-fieldwork-categories';

jest.mock('@/components/common/BottomSheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

const C = KOREAN_FIELDWORK_CATEGORIES;

describe('MapBottomSheet', () => {
  it('uses trench workflow steps when the project is in trial trench mode', () => {
    const handleToggle = jest.fn();
    const { getByTestId, getByText, queryByText } = render(
      createBottomSheet({
        investigationModeId: 'trialTrench',
        toggleFeatureWorkflowStep: handleToggle,
      })
    );

    expect(getByText('토층 정리')).toBeTruthy();
    expect(getByText('피트 토층도')).toBeTruthy();
    expect(queryByText('유물 수습')).toBeNull();

    fireEvent.press(getByTestId('mapWorkflowStep_trenchPitOpened'));

    expect(handleToggle).toHaveBeenCalledWith('trenchPitOpened');
  });

  it('uses excavation workflow steps outside trench mode', () => {
    const { getByText, queryByText } = render(
      createBottomSheet({ investigationModeId: 'excavation' })
    );

    expect(getByText('수습 전 사진')).toBeTruthy();
    expect(getByText('유물 수습')).toBeTruthy();
    expect(queryByText('피트 토층도')).toBeNull();
  });
});

const createBottomSheet = (
  props: Partial<React.ComponentProps<typeof MapBottomSheet>> = {}
) => (
  <MapBottomSheet
    document={createDoc()}
    addDocument={jest.fn()}
    editDocument={jest.fn()}
    removeDocument={jest.fn()}
    focusHandler={jest.fn()}
    canCreateLocationCandidate={false}
    canCreatePenMemo={true}
    canCreateSoilProfilePhoto={true}
    canCreateSurveyBoundary={false}
    createFeatureCandidateAtCurrentLocation={jest.fn()}
    createPenMemoDraft={jest.fn()}
    createSoilProfilePhotoDraft={jest.fn()}
    createSurveyBoundaryDraft={jest.fn()}
    markGeometryNeedsAerialAlignment={jest.fn()}
    markGeometryAdjustedToAerialLayer={jest.fn()}
    toggleFeatureWorkflowStep={jest.fn()}
    readinessIssues={[]}
    {...props}
  />
);

const createDoc = () => ({
  resource: {
    id: 'feature-1',
    identifier: '조선시대 1호 수혈',
    category: C.FEATURE,
    relations: {},
    featureInvestigationChecklist: ['trenchSoilCleaned'],
  },
} as any);
