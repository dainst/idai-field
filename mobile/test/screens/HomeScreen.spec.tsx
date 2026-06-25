import {
  fireEvent,
  render,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import HomeScreen from '@/app/(tabs)';
import { PreferencesContext } from '@/contexts/preferences-context';
import { UsePreferences } from '@/hooks/use-preferences';
import { defaultMapSettings } from '@/components/Project/Map/map-settings';
import { SAMPLE_PROJECT_ID } from '@/constants/sample-project';

const safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
  },
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows starting project setup before the worker name is set', () => {
    const preferences = createPreferencesContextValue({
      username: '',
      recentProjects: [],
    });
    const { getByTestId } = renderHomeScreen(preferences);

    fireEvent.press(getByTestId('create-project-button'));

    expect(getByTestId('project-input')).toBeTruthy();
  });

  it('opens settings when pressing the setup reminder', () => {
    const preferences = createPreferencesContextValue({
      username: '',
      recentProjects: [],
    });
    const { getByLabelText, getByText } = renderHomeScreen(preferences);

    expect(getByText('설정 확인 필요')).toBeTruthy();
    fireEvent.press(getByLabelText('작업자 이름과 프로젝트 기본 설정 열기'));

    expect(router.navigate).toHaveBeenCalledWith('/SettingsScreen');
  });

  it('allows opening the sample project before the worker name is set', () => {
    const setCurrentProject = jest.fn();
    const preferences = createPreferencesContextValue({
      username: '',
      recentProjects: [],
      setCurrentProject,
    });
    const { getByTestId } = renderHomeScreen(preferences);

    fireEvent.press(getByTestId('sample-project-button'));

    expect(setCurrentProject).toHaveBeenCalledWith(
      SAMPLE_PROJECT_ID,
      undefined,
      { includeInRecentProjects: false }
    );
    expect(router.navigate).toHaveBeenCalledWith('/ProjectScreen');
  });

  it('allows opening recent projects before the worker name is set', () => {
    const setCurrentProject = jest.fn();
    const preferences = createPreferencesContextValue({
      username: '',
      recentProjects: ['fieldwork-1'],
      setCurrentProject,
    });
    const { getByTestId } = renderHomeScreen(preferences);

    fireEvent.press(getByTestId('open-project-button'));

    expect(setCurrentProject).toHaveBeenCalledWith(
      'fieldwork-1',
      undefined,
      { includeInRecentProjects: true }
    );
    expect(router.navigate).toHaveBeenCalledWith('/ProjectScreen');
  });

  it('deletes recent projects through preferences when no delete prop is supplied', () => {
    const removeProject = jest.fn();
    const preferences = createPreferencesContextValue({
      username: '',
      recentProjects: ['fieldwork-1'],
      removeProject,
    });
    const { getByTestId } = renderHomeScreen(preferences);

    fireEvent.press(getByTestId('delete-project-button'));
    fireEvent.changeText(getByTestId('delete-password-input'), '1234');
    fireEvent.press(getByTestId('confirm-delete-project-button'));

    expect(removeProject).toHaveBeenCalledWith('fieldwork-1');
  });

  it('keeps the recent project picker compact on the home screen', () => {
    const preferences = createPreferencesContextValue({
      username: '현장 작업자',
      recentProjects: ['fieldwork-1'],
    });
    const { getByTestId } = renderHomeScreen(preferences);
    const cardStyle = StyleSheet.flatten(getByTestId('recent-projects-card').props.style);

    expect(cardStyle.flex).toBeUndefined();
    expect(cardStyle.minHeight).toBeUndefined();
    expect(cardStyle.borderRadius).toBeLessThanOrEqual(8);
  });

  it('opens imported server projects immediately after saving sync settings', () => {
    const setCurrentProject = jest.fn();
    const setProjectSettings = jest.fn();
    const preferences = createPreferencesContextValue({
      username: '',
      recentProjects: [],
      setCurrentProject,
      setProjectSettings,
    });
    const { getByTestId } = renderHomeScreen(preferences);

    fireEvent.press(getByTestId('load-project-button'));
    fireEvent.changeText(getByTestId('load-input'), '  server-project  ');
    fireEvent.changeText(getByTestId('load-url-input'), '  https://field.example/db  ');
    fireEvent.changeText(getByTestId('load-password-input'), '  secret  ');
    fireEvent.press(getByTestId('load-project-submit'));

    expect(setCurrentProject).toHaveBeenCalledWith('server-project');
    expect(setProjectSettings).toHaveBeenCalledWith(
      'server-project',
      {
        url: 'https://field.example/db',
        password: 'secret',
        connected: true,
        mapSettings: defaultMapSettings(),
      }
    );
    expect(router.navigate).toHaveBeenCalledWith('/ProjectScreen');
  });

  it('does not import over an existing project name', () => {
    const setCurrentProject = jest.fn();
    const setProjectSettings = jest.fn();
    const preferences = createPreferencesContextValue({
      username: '',
      recentProjects: ['server-project'],
      setCurrentProject,
      setProjectSettings,
    });
    const { getByTestId } = renderHomeScreen(preferences);

    fireEvent.press(getByTestId('load-project-button'));
    fireEvent.changeText(getByTestId('load-input'), '  server-project  ');
    fireEvent.changeText(getByTestId('load-url-input'), 'https://field.example/db');
    fireEvent.changeText(getByTestId('load-password-input'), 'secret');
    fireEvent.press(getByTestId('load-project-submit'));

    expect(setCurrentProject).not.toHaveBeenCalled();
    expect(setProjectSettings).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalledWith('/ProjectScreen');
  });
});

const renderHomeScreen = (
  preferences: UsePreferences,
  props: Partial<React.ComponentProps<typeof HomeScreen>> = {}
) =>
  render(
    <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
      <PreferencesContext.Provider value={preferences}>
        <HomeScreen {...props} />
      </PreferencesContext.Provider>
    </SafeAreaInsetsContext.Provider>
  );

const createPreferencesContextValue = ({
  username,
  recentProjects,
  setCurrentProject = jest.fn(),
  setProjectSettings = jest.fn(),
  removeProject = jest.fn(),
}: {
  username: string;
  recentProjects: string[];
  setCurrentProject?: UsePreferences['setCurrentProject'];
  setProjectSettings?: UsePreferences['setProjectSettings'];
  removeProject?: UsePreferences['removeProject'];
}): UsePreferences => ({
  preferences: {
    username,
    languages: ['ko'],
    currentProject: recentProjects[0] ?? '',
    recentProjects,
    mapProviderSettings: {
      kakaoLocalRestApiKey: '',
      kakaoMapJavaScriptKey: '',
      kakaoNativeAppKey: '',
    },
    projects: Object.fromEntries(
      recentProjects.map((project) => [
        project,
        {
          url: '',
          password: '',
          connected: false,
          languages: ['ko'],
          mapSettings: defaultMapSettings(),
        },
      ])
    ),
  },
  setCurrentProject,
  setUsername: jest.fn(),
  setProjectSettings,
  setLanguages: jest.fn(),
  removeProject,
  setMapProviderSettings: jest.fn(),
  getMapSettings: jest.fn(() => defaultMapSettings()),
  setMapSettings: jest.fn(),
});
