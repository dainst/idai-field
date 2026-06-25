import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import {
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import React from 'react';
import SettingsScreen from '@/app/(tabs)/SettingsScreen';
import { PreferencesContext } from '@/contexts/preferences-context';
import { UsePreferences } from '@/hooks/use-preferences';
import { defaultMapSettings } from '@/components/Project/Map/map-settings';
import {
  createKoreanFieldworkBoundarySummaryStorageKey,
  createKoreanFieldworkInvestigationModeStorageKey,
} from '@/components/Project/korean-fieldwork-investigation-mode';
import useConfiguration from '@/hooks/use-configuration';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useRepository from '@/hooks/use-repository';

const safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));
jest.mock('@/hooks/use-pouchdb-datastore', () => jest.fn());
jest.mock('@/hooks/use-configuration', () => jest.fn());
jest.mock('@/hooks/use-repository', () => jest.fn());

const mockedUsePouchDbDatastore = usePouchDbDatastore as jest.Mock;
const mockedUseConfiguration = useConfiguration as jest.Mock;
const mockedUseRepository = useRepository as jest.Mock;

describe('SettingsScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedUsePouchDbDatastore.mockReturnValue(undefined);
    mockedUseConfiguration.mockReturnValue(undefined);
    mockedUseRepository.mockReturnValue(undefined);
  });

  it('saves worker name and current project investigation mode', async () => {
    const setUsername = jest.fn();
    const preferences = createPreferencesContextValue(setUsername);
    const projectDocument = {
      _id: 'project',
      resource: {
        id: 'project',
        identifier: 'fieldwork-1',
        category: 'Project',
        relations: {},
      },
      created: { user: '', date: new Date() },
      modified: [],
    };
    const repository = {
      get: jest.fn().mockResolvedValue(projectDocument),
      update: jest.fn(async (document) => document),
    };
    mockedUsePouchDbDatastore.mockReturnValue({} as any);
    mockedUseConfiguration.mockReturnValue({} as any);
    mockedUseRepository.mockReturnValue(repository);

    const { getByDisplayValue, getByTestId, getByText } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <PreferencesContext.Provider value={preferences}>
          <SettingsScreen />
        </PreferencesContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );

    expect(getByTestId('settings-current-project')).toBeTruthy();
    expect(getByText('프로젝트 기본 설정')).toBeTruthy();
    expect(getByText('개인 기본값')).toBeTruthy();
    expect(getByText('조사 방식')).toBeTruthy();
    expect(getByText('조사 경계')).toBeTruthy();
    expect(getByText('작업자 이름')).toBeTruthy();
    expect(getByTestId('settings-investigation-mode_excavation').props.disabled)
      .not.toBe(true);
    expect(getByText(
      '작업자 이름은 따로 저장할 수 있습니다. 조사 방식과 조사 경계를 채우면 프로젝트 기본값도 함께 저장됩니다.'
    )).toBeTruthy();

    fireEvent.changeText(getByTestId('settings-username-input'), '  조사원  ');
    fireEvent.press(getByTestId('settings-investigation-mode_excavation'));
    fireEvent.changeText(
      getByTestId('settings-boundary-summary-input'),
      '  1구역 북쪽 능선부터 남쪽 농로까지  '
    );

    await waitFor(() => {
      expect(getByDisplayValue('  1구역 북쪽 능선부터 남쪽 농로까지  '))
        .toBeTruthy();
      expect(getByTestId('settings-save').props.disabled).not.toBe(true);
      expect(getByText('저장하면 작업자 이름과 프로젝트 기본값을 함께 저장합니다.'))
        .toBeTruthy();
    }, { timeout: 1000 });

    fireEvent.press(getByTestId('settings-save'));

    await waitFor(() => {
      expect(setUsername).toHaveBeenCalledWith('조사원');
      expect(router.back).toHaveBeenCalled();
    }, { timeout: 1000 });
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkInvestigationModeStorageKey('fieldwork-1')
    )).resolves.toBe('excavation');
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkBoundarySummaryStorageKey('fieldwork-1')
    )).resolves.toBe('1구역 북쪽 능선부터 남쪽 농로까지');
  }, 15000);

  it('syncs current project setup changes to the project document', async () => {
    const projectDocument = {
      _id: 'project',
      resource: {
        id: 'project',
        identifier: 'fieldwork-1',
        category: 'Project',
        relations: {},
        projectInvestigationMode: 'trialTrench',
        projectBoundarySetupState: 'notStarted',
      },
      created: { user: '', date: new Date() },
      modified: [],
    };
    const repository = {
      get: jest.fn().mockResolvedValue(projectDocument),
      update: jest.fn(async (document) => document),
    };
    mockedUsePouchDbDatastore.mockReturnValue({} as any);
    mockedUseConfiguration.mockReturnValue({} as any);
    mockedUseRepository.mockReturnValue(repository);

    const preferences = createPreferencesContextValue(jest.fn());
    const { getByTestId, getByText } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <PreferencesContext.Provider value={preferences}>
          <SettingsScreen />
        </PreferencesContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('settings-current-project')).toBeTruthy();
    });

    fireEvent.press(getByTestId('settings-investigation-mode_excavation'));
    fireEvent.changeText(
      getByTestId('settings-boundary-summary-input'),
      '1구역 북쪽 능선부터 남쪽 농로까지'
    );
    fireEvent.press(getByTestId('settings-save'));

    await waitFor(() => {
      expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
        resource: expect.objectContaining({
          projectInvestigationMode: 'excavation',
          projectBoundarySetupState: 'draftBoundary',
          projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
          shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
        }),
      }));
    });
  });

  it('saves worker name even when legacy project setup is incomplete', async () => {
    const setUsername = jest.fn();
    const preferences = createPreferencesContextValue(setUsername);
    const repository = {
      get: jest.fn().mockRejectedValue(new Error('missing project document')),
      update: jest.fn(),
    };
    mockedUsePouchDbDatastore.mockReturnValue({} as any);
    mockedUseConfiguration.mockReturnValue({} as any);
    mockedUseRepository.mockReturnValue(repository);

    const { getByTestId, getByText, queryByText } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <PreferencesContext.Provider value={preferences}>
          <SettingsScreen />
        </PreferencesContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('settings-current-project')).toBeTruthy();
    });

    expect(queryByText('조사 방식을 선택해야 합니다.')).toBeNull();
    expect(queryByText('조사 경계 기준을 입력해야 합니다.')).toBeNull();
    expect(getByText(
      '작업자 이름은 따로 저장할 수 있습니다. 조사 방식과 조사 경계를 채우면 프로젝트 기본값도 함께 저장됩니다.'
    )).toBeTruthy();

    fireEvent.changeText(getByTestId('settings-username-input'), '  새 기록자  ');
    fireEvent.press(getByTestId('settings-save'));

    await waitFor(() => {
      expect(setUsername).toHaveBeenCalledWith('새 기록자');
      expect(router.back).toHaveBeenCalled();
    });
    expect(repository.update).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkInvestigationModeStorageKey('fieldwork-1')
    )).resolves.toBeNull();
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkBoundarySummaryStorageKey('fieldwork-1')
    )).resolves.toBeNull();
  });

  it('saves worker name without saving incomplete project setup drafts', async () => {
    const setUsername = jest.fn();
    const preferences = createPreferencesContextValue(setUsername);
    const { getByTestId, getByText } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <PreferencesContext.Provider value={preferences}>
          <SettingsScreen />
        </PreferencesContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('settings-current-project')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('settings-username-input'), '기록자');
    fireEvent.press(getByTestId('settings-investigation-mode_excavation'));
    fireEvent.changeText(getByTestId('settings-boundary-summary-input'), '   ');

    await waitFor(() => {
      expect(getByText(
        '조사 방식과 조사 경계를 모두 채우면 프로젝트 기본값도 같이 저장됩니다. 지금 저장하면 작업자 이름만 저장합니다.'
      )).toBeTruthy();
    });

    fireEvent.press(getByTestId('settings-save'));

    await waitFor(() => {
      expect(setUsername).toHaveBeenCalledWith('기록자');
      expect(router.back).toHaveBeenCalled();
    });
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkInvestigationModeStorageKey('fieldwork-1')
    )).resolves.toBeNull();
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkBoundarySummaryStorageKey('fieldwork-1')
    )).resolves.toBeNull();
  });

  it('saves current project setup even when the worker name is still empty', async () => {
    const setUsername = jest.fn();
    const preferences = createPreferencesContextValue(setUsername, {
      username: '',
    });
    const projectDocument = {
      _id: 'project',
      resource: {
        id: 'project',
        identifier: 'fieldwork-1',
        category: 'Project',
        relations: {},
      },
      created: { user: '', date: new Date() },
      modified: [],
    };
    const repository = {
      get: jest.fn().mockResolvedValue(projectDocument),
      update: jest.fn(async (document) => document),
    };
    mockedUsePouchDbDatastore.mockReturnValue({} as any);
    mockedUseConfiguration.mockReturnValue({} as any);
    mockedUseRepository.mockReturnValue(repository);

    const { getByTestId } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <PreferencesContext.Provider value={preferences}>
          <SettingsScreen />
        </PreferencesContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('settings-current-project')).toBeTruthy();
    });

    fireEvent.press(getByTestId('settings-investigation-mode_surfaceSurvey'));
    fireEvent.changeText(
      getByTestId('settings-boundary-summary-input'),
      '  하천 동쪽 조사 범위  '
    );
    fireEvent.press(getByTestId('settings-save'));

    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
    expect(setUsername).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkInvestigationModeStorageKey('fieldwork-1')
    )).resolves.toBe('surfaceSurvey');
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkBoundarySummaryStorageKey('fieldwork-1')
    )).resolves.toBe('하천 동쪽 조사 범위');
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      resource: expect.objectContaining({
        projectInvestigationMode: 'surfaceSurvey',
        projectBoundarySummary: '하천 동쪽 조사 범위',
      }),
    }));
  });

  it('saves Kakao map provider keys without hardcoding them into project setup', async () => {
    const setMapProviderSettings = jest.fn();
    const preferences = createPreferencesContextValue(jest.fn(), {
      mapProviderSettings: {
        kakaoLocalRestApiKey: '',
        kakaoMapJavaScriptKey: '',
        kakaoNativeAppKey: '',
      },
    }, {
      setMapProviderSettings,
    });

    const { getByTestId, getByText } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <PreferencesContext.Provider value={preferences}>
          <SettingsScreen />
        </PreferencesContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('지도 API 키')).toBeTruthy();
    });

    fireEvent.changeText(
      getByTestId('settings-kakao-local-rest-api-key-input'),
      '  rest-key  '
    );
    fireEvent.changeText(
      getByTestId('settings-kakao-map-javascript-key-input'),
      '  js-key  '
    );
    fireEvent.changeText(
      getByTestId('settings-kakao-native-app-key-input'),
      '  native-key  '
    );
    fireEvent.press(getByTestId('settings-save'));

    await waitFor(() => {
      expect(setMapProviderSettings).toHaveBeenCalledWith(expect.objectContaining({
        kakaoLocalRestApiKey: 'rest-key',
        kakaoMapJavaScriptKey: 'js-key',
        kakaoNativeAppKey: 'native-key',
      }));
      expect(router.back).toHaveBeenCalled();
    });
  });

  it('loads current project setup from the project document when local values are missing', async () => {
    const projectDocument = {
      _id: 'project',
      resource: {
        id: 'project',
        identifier: 'fieldwork-1',
        category: 'Project',
        relations: {},
        projectInvestigationMode: 'surfaceSurvey',
        projectBoundarySummary: '문헌상 1지점부터 하천 동쪽 경계까지',
      },
      created: { user: '', date: new Date() },
      modified: [],
    };
    const repository = {
      get: jest.fn().mockResolvedValue(projectDocument),
      update: jest.fn(async (document) => document),
    };
    mockedUsePouchDbDatastore.mockReturnValue({} as any);
    mockedUseConfiguration.mockReturnValue({} as any);
    mockedUseRepository.mockReturnValue(repository);

    const preferences = createPreferencesContextValue(jest.fn());
    const { getByDisplayValue, getByTestId } = render(
      <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
        <PreferencesContext.Provider value={preferences}>
          <SettingsScreen />
        </PreferencesContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );

    await waitFor(() => {
      expect(getByDisplayValue('문헌상 1지점부터 하천 동쪽 경계까지')).toBeTruthy();
    });
    fireEvent.press(getByTestId('settings-save'));

    await expect(AsyncStorage.getItem(
      createKoreanFieldworkInvestigationModeStorageKey('fieldwork-1')
    )).resolves.toBe('surfaceSurvey');
    await expect(AsyncStorage.getItem(
      createKoreanFieldworkBoundarySummaryStorageKey('fieldwork-1')
    )).resolves.toBe('문헌상 1지점부터 하천 동쪽 경계까지');
  });
});

const createPreferencesContextValue = (
  setUsername: UsePreferences['setUsername'],
  overrides: Partial<UsePreferences['preferences']> = {},
  contextOverrides: Partial<UsePreferences> = {}
): UsePreferences => ({
  preferences: {
    username: '기록자',
    languages: ['ko'],
    currentProject: 'fieldwork-1',
    recentProjects: ['fieldwork-1'],
    mapProviderSettings: {
      kakaoLocalRestApiKey: '',
      kakaoMapJavaScriptKey: '',
      kakaoNativeAppKey: '',
    },
    projects: {
      'fieldwork-1': {
        url: '',
        password: '',
        connected: false,
        languages: ['ko'],
        mapSettings: defaultMapSettings(),
      },
    },
    ...overrides,
  },
  setCurrentProject: jest.fn(),
  setUsername,
  setProjectSettings: jest.fn(),
  setLanguages: jest.fn(),
  removeProject: jest.fn(),
  setMapProviderSettings: jest.fn(),
  getMapSettings: jest.fn(() => defaultMapSettings()),
  setMapSettings: jest.fn(),
  ...contextOverrides,
});
