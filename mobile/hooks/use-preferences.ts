import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { compose, detach, prepend, set, subtract, update } from 'tsfun';
import {
  MapProviderSettings,
  Preferences,
  ProjectSettings,
} from '@/models/preferences';
import { defaultPointRadius } from '@/components/Project/Map/GLMap/constants';
import {
  MapSettings,
  normalizeMapSettings as normalizeStoredMapSettings,
} from '@/components/Project/Map/map-settings';
import { getDefaultProjectLanguages } from '@/constants/korean-fieldwork-project';
import { isSampleProject } from '@/constants/sample-project';

type SetCurrentProjectOptions = {
  includeInRecentProjects?: boolean;
};

export const PREFERENCES_STORAGE_KEY = 'preferences';
export const PROJECT_PASSWORDS_SECURE_STORAGE_KEY = 'preferences.projectPasswords';
export const MAP_PROVIDER_SETTINGS_SECURE_STORAGE_KEY = 'preferences.mapProviderSettings';

export interface UsePreferences {
  preferences: Preferences;
  setCurrentProject: (
    project: string,
    languages?: string[],
    options?: SetCurrentProjectOptions
  ) => void;
  setUsername: (project: string) => void;
  setProjectSettings: (
    project: string,
    projectSettings: ProjectSettings
  ) => void;
  setLanguages: (languages: string[]) => void;
  removeProject: (project: string) => void;
  setMapProviderSettings: (mapProviderSettings: MapProviderSettings) => void;
  getMapSettings: (project: string) => MapSettings;
  setMapSettings: (project: string, mapSettings: MapSettings) => void;
}

const usePreferences = (): UsePreferences => {
  const [preferences, setPreferences] = useState<Preferences>(
    getDefaultPreferences()
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadPreferences().then((loadedPreferences) => {
      setPreferences(loadedPreferences);
      setPreferencesLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    void savePreferences(preferences).catch((error) => {
      console.warn('Failed to save preferences.', error);
    });
  }, [preferences, preferencesLoaded]);

  const setCurrentProject = (
    project: string,
    languages?: string[],
    options: SetCurrentProjectOptions = {}
  ) =>
    setPreferences((preferences) => {
      const previousProjectSettings = preferences.projects[project];
      const projectSettings = normalizeProjectSettings(
        project,
        {
          ...(previousProjectSettings ?? {}),
          ...(languages ? { languages } : {}),
        },
        previousProjectSettings
      );
      const includeInRecentProjects = options.includeInRecentProjects ?? true;

      return {
        ...preferences,
        currentProject: project,
        recentProjects: includeInRecentProjects
          ? set(prepend(project)(preferences.recentProjects))
          : preferences.recentProjects,
        languages: projectSettings.languages ?? getDefaultProjectLanguages(project),
        projects: {
          ...preferences.projects,
          [project]: projectSettings,
        },
      };
    });

  const setProjectSettings = (
    project: string,
    projectSettings: ProjectSettings
  ) => setPreferences((preferences) => ({
    ...preferences,
    projects: {
      ...preferences.projects,
      [project]: normalizeProjectSettings(project, projectSettings, preferences.projects[project]),
    },
  }));

  const setUsername = (username: string) =>
    setPreferences(update('username', username));

  const setLanguages = (languages: string[]) =>
    setPreferences((preferences) => {
      if (!preferences.currentProject) return { ...preferences, languages };

      return {
        ...preferences,
        languages,
        projects: {
          ...preferences.projects,
          [preferences.currentProject]: normalizeProjectSettings(
            preferences.currentProject,
            { ...(preferences.projects[preferences.currentProject] ?? {}), languages },
            preferences.projects[preferences.currentProject]
          ),
        },
      };
    });

  const setMapProviderSettings = (mapProviderSettings: MapProviderSettings) =>
    setPreferences((preferences) => ({
      ...preferences,
      mapProviderSettings: normalizeMapProviderSettings(mapProviderSettings),
    }));

  const removeProject = (project: string) =>
    setPreferences(
      compose(
        update('projects', detach(project)),
        update('recentProjects', subtract([project])),
        update('currentProject', (p: string) => (p === project ? '' : p))
      )
    );

  const getMapSettings = (project: string): MapSettings =>
    project
      ? normalizeProjectSettings(
        project,
        preferences.projects[project] ?? {}
      ).mapSettings
      : getDefaultProjectSettings(project).mapSettings;

  const setMapSettings = (project: string, mapSettings: MapSettings) => {
    if (!project) return;

    setPreferences((preferences) => ({
      ...preferences,
      projects: {
        ...preferences.projects,
        [project]: normalizeProjectSettings(
          project,
          {
            ...(preferences.projects[project] ?? {}),
            mapSettings: { ...mapSettings },
          },
          preferences.projects[project]
        ),
      },
    }));
  };

  return {
    preferences,
    setCurrentProject,
    setUsername,
    setProjectSettings,
    setLanguages,
    removeProject,
    setMapProviderSettings,
    getMapSettings,
    setMapSettings,
  };
};

export default usePreferences;

const loadPreferences = async (): Promise<Preferences> => {
  const prefString = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!prefString) return hydrateSecurePreferences(getDefaultPreferences());

  try {
    return hydrateSecurePreferences(normalizePreferences(JSON.parse(prefString)));
  } catch (error) {
    console.warn('Failed to load saved preferences. Falling back to defaults.', error);
    return hydrateSecurePreferences(getDefaultPreferences());
  }
};

const savePreferences = async (preferences: Preferences) => {
  const [projectPasswordsSavedSecurely, mapProviderSettingsSavedSecurely] = await Promise.all([
    saveSecureJson(
    PROJECT_PASSWORDS_SECURE_STORAGE_KEY,
    getProjectPasswords(preferences)
    ),
    saveSecureJson(
    MAP_PROVIDER_SETTINGS_SECURE_STORAGE_KEY,
    preferences.mapProviderSettings
    ),
  ]);

  await AsyncStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(stripSecurePreferences(preferences, {
      stripProjectPasswords: projectPasswordsSavedSecurely,
      stripMapProviderSettings: mapProviderSettingsSavedSecurely,
    }))
  );
};

export const getDefaultPreferences = (): Preferences => ({
  languages: getDefaultProjectLanguages(''),
  currentProject: '',
  username: '',
  recentProjects: [],
  projects: {},
  mapProviderSettings: defaultMapProviderSettings(),
});

export const defaultMapProviderSettings = (): MapProviderSettings => ({
  kakaoLocalRestApiKey: '',
  kakaoMapJavaScriptKey: '',
  kakaoNativeAppKey: '',
});

const getDefaultProjectSettings = (project: string = ''): ProjectSettings => ({
  url: '',
  password: '',
  connected: false,
  languages: getDefaultProjectLanguages(project),
  mapSettings: {
    pointRadius: defaultPointRadius,
  },
});

const normalizePreferences = (preferences: unknown): Preferences => {
  const safePreferences = isRecord(preferences) ? preferences : {};
  const storedProjects = isRecord(safePreferences.projects)
    ? safePreferences.projects
    : {};
  const projects = Object.entries(storedProjects).reduce(
    (result, [project, projectSettings]) => ({
      ...result,
      [project]: normalizeProjectSettings(project, projectSettings),
    }),
    {} as Record<string, ProjectSettings>
  );
  const currentProject = typeof safePreferences.currentProject === 'string'
    ? safePreferences.currentProject
    : '';
  const currentProjectSettings = currentProject
    ? projects[currentProject]
    : undefined;
  const recentProjects = Array.isArray(safePreferences.recentProjects)
    ? safePreferences.recentProjects.filter(
      (project): project is string => typeof project === 'string' && !isSampleProject(project)
    )
    : [];
  const languages = getStringArray(safePreferences.languages);

  return {
    ...getDefaultPreferences(),
    username: typeof safePreferences.username === 'string'
      ? safePreferences.username
      : '',
    currentProject,
    projects,
    recentProjects,
    mapProviderSettings: normalizeMapProviderSettings(
      safePreferences.mapProviderSettings
    ),
    languages: currentProjectSettings?.languages
      ?? languages
      ?? getDefaultProjectLanguages(currentProject),
  };
};

const hydrateSecurePreferences = async (preferences: Preferences): Promise<Preferences> => {
  const [storedProjectPasswords, storedMapProviderSettings] = await Promise.all([
    loadSecureJson(PROJECT_PASSWORDS_SECURE_STORAGE_KEY),
    loadSecureJson(MAP_PROVIDER_SETTINGS_SECURE_STORAGE_KEY),
  ]);
  const projectPasswords = isRecord(storedProjectPasswords)
    ? storedProjectPasswords
    : {};
  const projects = Object.entries(preferences.projects).reduce(
    (result, [project, projectSettings]) => ({
      ...result,
      [project]: {
        ...projectSettings,
        password: getStringValue(projectPasswords[project]) ?? projectSettings.password,
      },
    }),
    {} as Record<string, ProjectSettings>
  );

  return {
    ...preferences,
    projects,
    mapProviderSettings: isRecord(storedMapProviderSettings)
      ? normalizeMapProviderSettings(storedMapProviderSettings)
      : preferences.mapProviderSettings,
  };
};

const stripSecurePreferences = (
  preferences: Preferences,
  {
    stripProjectPasswords = true,
    stripMapProviderSettings = true,
  }: {
    stripProjectPasswords?: boolean;
    stripMapProviderSettings?: boolean;
  } = {}
): Preferences => ({
  ...preferences,
  projects: Object.entries(preferences.projects).reduce(
    (result, [project, projectSettings]) => ({
      ...result,
      [project]: {
        ...projectSettings,
        password: stripProjectPasswords ? '' : projectSettings.password,
      },
    }),
    {} as Record<string, ProjectSettings>
  ),
  mapProviderSettings: stripMapProviderSettings
    ? defaultMapProviderSettings()
    : preferences.mapProviderSettings,
});

const getProjectPasswords = (preferences: Preferences): Record<string, string> =>
  Object.entries(preferences.projects).reduce(
    (result, [project, projectSettings]) => projectSettings.password
      ? { ...result, [project]: projectSettings.password }
      : result,
    {} as Record<string, string>
  );

const loadSecureJson = async (key: string): Promise<unknown> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : undefined;
  } catch (error) {
    console.warn(`Failed to load secure preference '${key}'.`, error);
    return undefined;
  }
};

const saveSecureJson = async (key: string, value: unknown): Promise<boolean> => {
  try {
    if (!hasPersistableSecureValue(value)) {
      await SecureStore.deleteItemAsync(key);
      return true;
    }

    await SecureStore.setItemAsync(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to save secure preference '${key}'.`, error);
    return false;
  }
};

const hasPersistableSecureValue = (value: unknown): boolean => {
  if (!isRecord(value)) return value !== undefined && value !== null;

  return Object.values(value).some((entry) => {
    if (typeof entry === 'string') return entry.length > 0;
    if (isRecord(entry)) return hasPersistableSecureValue(entry);
    return entry !== undefined && entry !== null;
  });
};

const normalizeMapProviderSettings = (
  mapProviderSettings: unknown
): MapProviderSettings => {
  const safeMapProviderSettings = isRecord(mapProviderSettings)
    ? mapProviderSettings
    : {};

  return {
    kakaoLocalRestApiKey: getStringValue(safeMapProviderSettings.kakaoLocalRestApiKey) ?? '',
    kakaoMapJavaScriptKey: getStringValue(safeMapProviderSettings.kakaoMapJavaScriptKey) ?? '',
    kakaoNativeAppKey: getStringValue(safeMapProviderSettings.kakaoNativeAppKey) ?? '',
  };
};

const normalizeProjectSettings = (
  project: string,
  projectSettings: unknown,
  previousProjectSettings?: ProjectSettings
): ProjectSettings => {
  const safeProjectSettings: Record<string, any> = isRecord(projectSettings) ? projectSettings : {};
  const safePreviousProjectSettings: Record<string, any> = isRecord(previousProjectSettings)
    ? previousProjectSettings
    : {};
  const languages =
    getStringArray(safeProjectSettings.languages)
    ?? getStringArray(safePreviousProjectSettings.languages)
    ?? getDefaultProjectLanguages(project);
  const defaultSettings = getDefaultProjectSettings(project);
  const previousMapSettings = normalizeStoredMapSettings(safePreviousProjectSettings.mapSettings);
  const mapSettings = normalizeStoredMapSettings(safeProjectSettings.mapSettings);

  return {
    url: getStringValue(safeProjectSettings.url)
      ?? getStringValue(safePreviousProjectSettings.url)
      ?? defaultSettings.url,
    password: getStringValue(safeProjectSettings.password)
      ?? getStringValue(safePreviousProjectSettings.password)
      ?? defaultSettings.password,
    connected: getBooleanValue(safeProjectSettings.connected)
      ?? getBooleanValue(safePreviousProjectSettings.connected)
      ?? defaultSettings.connected,
    languages,
    mapSettings: mapSettings ?? previousMapSettings ?? defaultSettings.mapSettings,
  };
};

const getStringValue = (value: unknown): string|undefined =>
  typeof value === 'string' ? value : undefined;

const getBooleanValue = (value: unknown): boolean|undefined =>
  typeof value === 'boolean' ? value : undefined;

const getStringArray = (value: unknown): string[]|undefined =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? value
    : undefined;

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
