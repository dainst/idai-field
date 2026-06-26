import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
    KOREAN_FIELDWORK_PROJECT_LANGUAGES,
} from '@/constants/korean-fieldwork-project';
import { SAMPLE_PROJECT_ID } from '@/constants/sample-project';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { defaultMapSettings } from '../components/Project/Map/map-settings';
import usePreferences, {
    MAP_PROVIDER_SETTINGS_SECURE_STORAGE_KEY,
    PREFERENCES_STORAGE_KEY,
    PROJECT_PASSWORDS_SECURE_STORAGE_KEY,
} from './use-preferences';

describe('usePreferences', () => {
    const koreanFieldworkProject = 'fieldwork-test';

    beforeEach(() => {

        AsyncStorage.clear();
        (SecureStore as any).__clearMock();
        jest.clearAllMocks();
    });


    it('should provide sensible default preferences', async () => {

        const { result } = await renderUsePreferences();
      
        expect(result.current.preferences.currentProject).toBe('');
        expect(result.current.preferences.recentProjects).toHaveLength(0);
        expect(result.current.preferences.languages).toEqual(KOREAN_FIELDWORK_PROJECT_LANGUAGES);
        expect(result.current.preferences.username).toBe('');
        expect(result.current.preferences.projects).toEqual({});
        expect(result.current.preferences.mapProviderSettings).toEqual({
            kakaoLocalRestApiKey: '',
            kakaoMapJavaScriptKey: '',
            kakaoNativeAppKey: '',
        });
    });


    it('should set username', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setUsername('Tester');
        });
      
        expect(result.current.preferences.username).toBe('Tester');
    });


    it('should set project languages', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setCurrentProject(koreanFieldworkProject, KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice());
        });

        expect(result.current.preferences.languages).toEqual(KOREAN_FIELDWORK_PROJECT_LANGUAGES);
        expect(result.current.preferences.projects[koreanFieldworkProject].languages)
            .toEqual(KOREAN_FIELDWORK_PROJECT_LANGUAGES);
    });

    it('should preserve explicitly provided project languages', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setCurrentProject('default-test', ['en']);
        });

        expect(result.current.preferences.languages).toEqual(['en']);
        expect(result.current.preferences.projects['default-test'].languages).toEqual(['en']);
    });


    it('should restore saved project languages when switching recent projects', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setCurrentProject(koreanFieldworkProject, KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice());
            result.current.setCurrentProject('default-test', ['en']);
            result.current.setCurrentProject(koreanFieldworkProject);
        });

        expect(result.current.preferences.languages).toEqual(KOREAN_FIELDWORK_PROJECT_LANGUAGES);
    });


    it('should preserve project languages when updating sync settings', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setCurrentProject(koreanFieldworkProject, KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice());
            result.current.setProjectSettings(koreanFieldworkProject, {
                url: 'https://test.url',
                password: 'testword',
                connected: true,
                mapSettings: defaultMapSettings(),
            });
        });

        expect(result.current.preferences.projects[koreanFieldworkProject].languages)
            .toEqual(KOREAN_FIELDWORK_PROJECT_LANGUAGES);
    });

    it('should use default map settings when project settings are missing', async () => {

        const { result } = await renderUsePreferences();

        expect(result.current.getMapSettings('not-yet-in-preferences')).toEqual(defaultMapSettings());

        await act(async () => {
            result.current.setMapSettings('not-yet-in-preferences', { pointRadius: 8 });
        });

        expect(result.current.preferences.projects['not-yet-in-preferences'].mapSettings)
            .toEqual({ pointRadius: 8 });
    });

    it('should preserve Kakao map provider keys as app-wide settings', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setMapProviderSettings({
                kakaoLocalRestApiKey: 'rest-key',
                kakaoMapJavaScriptKey: 'js-key',
                kakaoNativeAppKey: 'native-key',
            });
        });

        expect(result.current.preferences.mapProviderSettings)
            .toEqual({
                kakaoLocalRestApiKey: 'rest-key',
                kakaoMapJavaScriptKey: 'js-key',
                kakaoNativeAppKey: 'native-key',
            });
        await waitFor(() => expect(SecureStore.setItemAsync).toBeCalledWith(
            MAP_PROVIDER_SETTINGS_SECURE_STORAGE_KEY,
            JSON.stringify({
                kakaoLocalRestApiKey: 'rest-key',
                kakaoMapJavaScriptKey: 'js-key',
                kakaoNativeAppKey: 'native-key',
            })
        ));

        const storedPreferences = getLatestStoredPreferences();
        expect(storedPreferences.mapProviderSettings).toEqual({
            kakaoLocalRestApiKey: '',
            kakaoMapJavaScriptKey: '',
            kakaoNativeAppKey: '',
        });
        expect(JSON.stringify(storedPreferences)).not.toContain('rest-key');
    });


    it('should set project settings', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setProjectSettings('test2', {
                url: 'https://test.url',
                password: 'testword',
                connected: true,
                languages: ['en'],
                mapSettings: defaultMapSettings(),
            });
        });
      
        const settings = result.current.preferences.projects['test2'];
        expect(settings.url).toBe('https://test.url');
        expect(settings.password).toBe('testword');
        expect(settings.connected).toBe(true);
    });


    it('should persist project settings', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setProjectSettings('test2', {
                url: 'https://test.url',
                password: 'testword',
                connected: true,
                languages: ['en'],
                mapSettings: defaultMapSettings(),
            });
        });

        await waitFor(() => expect(SecureStore.setItemAsync).toBeCalledWith(
            PROJECT_PASSWORDS_SECURE_STORAGE_KEY,
            JSON.stringify({ test2: 'testword' })
        ));

        const storedPreferences = getLatestStoredPreferences();
        expect(storedPreferences.projects.test2.password).toBe('');
        expect(JSON.stringify(storedPreferences)).not.toContain('testword');

        const { result: result2 } = renderHook(() => usePreferences());

        // generates a warning
        // see https://github.com/testing-library/react-hooks-testing-library/issues/14
        jest.spyOn(console, 'error').mockImplementation(jest.fn());
        await waitFor(() => expect(result2.current.preferences.projects['test2']).toBeDefined());
        
        expect(AsyncStorage.getItem).toBeCalledWith(PREFERENCES_STORAGE_KEY);
      
        const settings = result2.current.preferences.projects['test2'];
        expect(settings.url).toBe('https://test.url');
        expect(settings.password).toBe('testword');
        expect(settings.connected).toBe(true);
    });


    it('should not strip stored project passwords when secure persistence fails', async () => {

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
        await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({
            languages: ['en'],
            currentProject: 'test2',
            username: 'Tester',
            recentProjects: ['test2'],
            mapProviderSettings: {
                kakaoLocalRestApiKey: '',
                kakaoMapJavaScriptKey: '',
                kakaoNativeAppKey: '',
            },
            projects: {
                test2: {
                    url: 'https://test.url',
                    password: 'legacyword',
                    connected: true,
                    languages: ['en'],
                    mapSettings: defaultMapSettings(),
                },
            },
        }));
        (AsyncStorage.setItem as jest.Mock).mockClear();
        (SecureStore.setItemAsync as jest.Mock)
            .mockRejectedValueOnce(new Error('secure store unavailable'));

        const { result } = await renderUsePreferences();

        await waitFor(() => expect(result.current.preferences.projects.test2.password)
            .toBe('legacyword'));
        await waitFor(() => expect(warnSpy).toHaveBeenCalled());

        expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
            PREFERENCES_STORAGE_KEY,
            expect.stringContaining('"password":""')
        );
        expect(await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY))
            .toContain('legacyword');

        warnSpy.mockRestore();
    });


    it('should preserve updated project passwords in AsyncStorage when secure persistence fails', async () => {

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
        (SecureStore.setItemAsync as jest.Mock)
            .mockRejectedValueOnce(new Error('secure store unavailable'));

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setProjectSettings('test2', {
                url: 'https://test.url',
                password: 'newword',
                connected: true,
                languages: ['en'],
                mapSettings: defaultMapSettings(),
            });
        });

        await waitFor(() => expect(warnSpy).toHaveBeenCalled());

        const storedPreferences = getLatestStoredPreferences();
        expect(storedPreferences.projects.test2.password).toBe('newword');
        expect(storedPreferences.projects.test2.connected).toBe(true);

        warnSpy.mockRestore();
    });


    it('should preserve updated map provider keys in AsyncStorage when secure persistence fails', async () => {

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
        (SecureStore.setItemAsync as jest.Mock)
            .mockRejectedValueOnce(new Error('secure store unavailable'));

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setMapProviderSettings({
                kakaoLocalRestApiKey: 'rest-key',
                kakaoMapJavaScriptKey: 'js-key',
                kakaoNativeAppKey: 'native-key',
            });
        });

        await waitFor(() => expect(warnSpy).toHaveBeenCalled());

        const storedPreferences = getLatestStoredPreferences();
        expect(storedPreferences.mapProviderSettings).toEqual({
            kakaoLocalRestApiKey: 'rest-key',
            kakaoMapJavaScriptKey: 'js-key',
            kakaoNativeAppKey: 'native-key',
        });

        warnSpy.mockRestore();
    });


    it('should prepend the current project to recent projects', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setCurrentProject('test1');
            result.current.setCurrentProject('test2');
            result.current.setCurrentProject('test3');
        });
      
        expect(result.current.preferences.currentProject).toBe('test3');
        expect(result.current.preferences.recentProjects).toHaveLength(3);
        expect(result.current.preferences.recentProjects[0]).toBe('test3');
        expect(result.current.preferences.recentProjects[1]).toBe('test2');
        expect(result.current.preferences.recentProjects[2]).toBe('test1');

        await act(async () => {
            result.current.setCurrentProject('test1');
        });
      
        expect(result.current.preferences.currentProject).toBe('test1');
        expect(result.current.preferences.recentProjects).toHaveLength(3);
        expect(result.current.preferences.recentProjects[0]).toBe('test1');
        expect(result.current.preferences.recentProjects[1]).toBe('test3');
        expect(result.current.preferences.recentProjects[2]).toBe('test2');
    });

    it('should allow opening a project without adding it to recent projects', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setCurrentProject('test1');
            result.current.setCurrentProject(SAMPLE_PROJECT_ID, undefined, { includeInRecentProjects: false });
        });

        expect(result.current.preferences.currentProject).toBe(SAMPLE_PROJECT_ID);
        expect(result.current.preferences.recentProjects).toEqual(['test1']);
    });

    it('should remove the reserved sample project from saved recent projects', async () => {

        await AsyncStorage.setItem('preferences', JSON.stringify({
            languages: KOREAN_FIELDWORK_PROJECT_LANGUAGES,
            currentProject: '',
            username: 'Tester',
            recentProjects: ['test1', SAMPLE_PROJECT_ID, 'test2'],
            projects: {},
        }));

        const { result } = await renderUsePreferences();

        expect(result.current.preferences.recentProjects).toEqual(['test1', 'test2']);
    });

    it('should fall back to defaults when saved preferences JSON is malformed', async () => {

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{broken json');

        const { result } = await renderUsePreferences();

        await waitFor(() => expect(warnSpy).toHaveBeenCalled());
        expect(result.current.preferences.username).toBe('');
        expect(result.current.preferences.currentProject).toBe('');
        expect(result.current.preferences.recentProjects).toEqual([]);
        expect(result.current.preferences.projects).toEqual({});

        warnSpy.mockRestore();
    });

    it('should normalize malformed saved preference fields', async () => {

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({
            username: 123,
            currentProject: 'project1',
            languages: [7],
            recentProjects: ['project1', SAMPLE_PROJECT_ID, 9],
            mapProviderSettings: {
                kakaoLocalRestApiKey: 'rest-key',
                kakaoMapJavaScriptKey: 'js-key',
                kakaoNativeAppKey: 'native-key',
            },
            projects: {
                project1: {
                    url: 5,
                    password: null,
                    connected: 'yes',
                    languages: ['en'],
                    mapSettings: { pointRadius: 'large' },
                },
            },
        }));

        const { result } = await renderUsePreferences();

        await waitFor(() => expect(result.current.preferences.currentProject).toBe('project1'));
        expect(result.current.preferences.username).toBe('');
        expect(result.current.preferences.languages).toEqual(['en']);
        expect(result.current.preferences.recentProjects).toEqual(['project1']);
        expect(result.current.preferences.projects.project1).toEqual({
            url: '',
            password: '',
            connected: false,
            languages: ['en'],
            mapSettings: defaultMapSettings(),
        });
        expect(result.current.preferences.mapProviderSettings).toEqual({
            kakaoLocalRestApiKey: 'rest-key',
            kakaoMapJavaScriptKey: 'js-key',
            kakaoNativeAppKey: 'native-key',
        });
    });

    it('should remove project', async () => {

        const { result } = await renderUsePreferences();

        await act(async () => {
            result.current.setCurrentProject('test1');
            result.current.setCurrentProject('test2');
            result.current.setCurrentProject('test3');
        });

        await act(async () => {
            result.current.removeProject('test3');
        });

        expect(result.current.preferences.projects['test3']).toBeUndefined();
        expect(result.current.preferences.recentProjects).toHaveLength(2);
    });

});

const renderUsePreferences = async () => {

    const renderResult = renderHook(() => usePreferences());
    await waitFor(() => expect(AsyncStorage.getItem).toBeCalledWith(PREFERENCES_STORAGE_KEY));
    return renderResult;
};

const getLatestStoredPreferences = () => {

    const calls = (AsyncStorage.setItem as jest.Mock).mock.calls
        .filter(([key]) => key === PREFERENCES_STORAGE_KEY);
    const latestCall = calls[calls.length - 1];
    return JSON.parse(latestCall[1]);
};
