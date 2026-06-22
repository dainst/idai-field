import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    KOREAN_FIELDWORK_PROJECT_LANGUAGES,
    KOREAN_FIELDWORK_PROJECT_PREFIX,
} from '@/constants/korean-fieldwork-project';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { defaultMapSettings } from '../components/Project/Map/map-settings';
import usePreferences from './use-preferences';

describe('usePreferences', () => {
    const koreanFieldworkProject = `${KOREAN_FIELDWORK_PROJECT_PREFIX}test`;

    beforeEach(() => {

        AsyncStorage.clear();
        jest.clearAllMocks();
    });


    it('should provide sensible default preferences', async () => {

        const { result } = await renderUsePreferences();
      
        expect(result.current.preferences.currentProject).toBe('');
        expect(result.current.preferences.recentProjects).toHaveLength(0);
        expect(result.current.preferences.languages).toEqual(KOREAN_FIELDWORK_PROJECT_LANGUAGES);
        expect(result.current.preferences.username).toBe('');
        expect(result.current.preferences.projects).toEqual({});
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

        expect(AsyncStorage.setItem).toBeCalledWith('preferences', JSON.stringify(result.current.preferences));

        const { result: result2 } = renderHook(() => usePreferences());

        // generates a warning
        // see https://github.com/testing-library/react-hooks-testing-library/issues/14
        jest.spyOn(console, 'error').mockImplementation(jest.fn());
        await waitFor(() => expect(result2.current.preferences.projects['test2']).toBeDefined());
        
        expect(AsyncStorage.getItem).toBeCalledWith('preferences');
      
        const settings = result2.current.preferences.projects['test2'];
        expect(settings.url).toBe('https://test.url');
        expect(settings.password).toBe('testword');
        expect(settings.connected).toBe(true);
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
    await waitFor(() => expect(AsyncStorage.getItem).toBeCalledWith('preferences'));
    return renderResult;
};
