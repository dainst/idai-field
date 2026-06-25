import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import React from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import CreateProjectModal from './CreateProjectModal';
import {
} from '../Project/korean-fieldwork-investigation-mode';
import { KOREAN_FIELDWORK_PROJECT_LANGUAGES } from '@/constants/korean-fieldwork-project';


const safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

describe('CreateProjectModal', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('requires project setup basics before creating the project', () => {
    const handleProjectCreated = jest.fn();
    const { getByTestId, queryByText } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <CreateProjectModal
          onProjectCreated={handleProjectCreated}
          onClose={jest.fn()}
        />
      </SafeAreaInsetsContext.Provider>
    );

    expect(queryByText('프로젝트 이름을 입력해야 합니다.')).toBeNull();
    expect(queryByText('조사 방식을 선택해야 합니다.')).toBeNull();
    expect(queryByText('조사 경계 기준을 입력해야 합니다.')).toBeNull();
    expect(queryByText('프로젝트 이름, 조사 방식, 조사 경계를 채우면 만들 수 있습니다.'))
      .toBeTruthy();
    expect(queryByText('프로젝트 기본 조사 방식을 정합니다.')).toBeTruthy();
    expect(queryByText('조사 경계 기준을 문장으로 남깁니다.')).toBeTruthy();
    expect(queryByText('프로젝트 생성 후 지도에서 경계를 그리거나 가져옵니다.')).toBeTruthy();

    fireEvent.changeText(getByTestId('project-input'), 'fieldwork-1');

    expect(queryByText('조사 방식과 조사 경계를 정하면 만들 수 있습니다.'))
      .toBeTruthy();

    fireEvent.press(getByTestId('create-project-submit'));

    expect(handleProjectCreated).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('project-investigation-mode_excavation'));

    expect(queryByText('조사 경계를 적으면 만들 수 있습니다.'))
      .toBeTruthy();

    fireEvent.press(getByTestId('create-project-submit'));

    expect(handleProjectCreated).not.toHaveBeenCalled();
  });

  it('points completed setup toward drawing or importing the boundary on the map', () => {
    const handleProjectCreated = jest.fn();
    const { getByTestId, getByText } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <CreateProjectModal
          onProjectCreated={handleProjectCreated}
          onClose={jest.fn()}
        />
      </SafeAreaInsetsContext.Provider>
    );

    fireEvent.changeText(getByTestId('project-input'), 'fieldwork-1');
    fireEvent.press(getByTestId('project-investigation-mode_excavation'));
    fireEvent.changeText(
      getByTestId('project-boundary-summary-input'),
      '1구역 북쪽 능선부터 남쪽 농로까지'
    );

    expect(getByText('준비 완료. 생성 뒤 지도에서 이 경계를 그리거나 가져와 확정하세요.'))
      .toBeTruthy();
    expect(getByText(
      '처음 정한 경계 기준입니다. 지도에서 도형을 그리거나 지원되는 파일 가져오기로 확정합니다.'
    )).toBeTruthy();
  });

  it('prevents creating a project with an existing normalized name', async () => {
    const handleProjectCreated = jest.fn();
    const { getByTestId } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <CreateProjectModal
          existingProjects={['fieldwork-1']}
          onProjectCreated={handleProjectCreated}
          onClose={jest.fn()}
        />
      </SafeAreaInsetsContext.Provider>
    );

    fireEvent.changeText(getByTestId('project-input'), '  fieldwork-1  ');
    fireEvent.press(getByTestId('project-investigation-mode_excavation'));
    fireEvent.changeText(
      getByTestId('project-boundary-summary-input'),
      '1구역 북쪽 능선부터 남쪽 농로까지'
    );
    fireEvent.press(getByTestId('create-project-submit'));

    expect(handleProjectCreated).not.toHaveBeenCalled();

    fireEvent.changeText(getByTestId('project-input'), '  fieldwork-2  ');
    fireEvent.press(getByTestId('create-project-submit'));

    await waitFor(() => {
      expect(handleProjectCreated).toHaveBeenCalledWith(
        'fieldwork-2',
        KOREAN_FIELDWORK_PROJECT_LANGUAGES
      );
    });
  });

  it('uses the typed project name without adding a Korean fieldwork prefix', async () => {
    const handleProjectCreated = jest.fn();
    const { getByTestId } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <CreateProjectModal
          onProjectCreated={handleProjectCreated}
          onClose={jest.fn()}
        />
      </SafeAreaInsetsContext.Provider>
    );

    fireEvent.changeText(getByTestId('project-input'), '  area-2026  ');
    fireEvent.press(getByTestId('project-investigation-mode_excavation'));
    fireEvent.changeText(
      getByTestId('project-boundary-summary-input'),
      'A구역 북쪽 능선'
    );
    fireEvent.press(getByTestId('create-project-submit'));

    await waitFor(() => {
      expect(handleProjectCreated).toHaveBeenCalledWith(
        'area-2026',
        KOREAN_FIELDWORK_PROJECT_LANGUAGES
      );
    });
    expect(handleProjectCreated).not.toHaveBeenCalledWith(
      'korean-fieldwork-area-2026',
      expect.anything()
    );
  });

  it('prevents creating a project with an unsafe database name', () => {
    const handleProjectCreated = jest.fn();
    const { getAllByText, getByTestId } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <CreateProjectModal
          onProjectCreated={handleProjectCreated}
          onClose={jest.fn()}
        />
      </SafeAreaInsetsContext.Provider>
    );

    fireEvent.changeText(getByTestId('project-input'), 'field/work:1');
    fireEvent.press(getByTestId('project-investigation-mode_excavation'));
    fireEvent.changeText(
      getByTestId('project-boundary-summary-input'),
      '1구역 북쪽 능선부터 남쪽 농로까지'
    );
    fireEvent.press(getByTestId('create-project-submit'));

    expect(getAllByText('프로젝트 이름에 / \\ : * ? " < > | 같은 문자는 쓸 수 없습니다.'))
      .toHaveLength(2);
    expect(handleProjectCreated).not.toHaveBeenCalled();
  });
});
