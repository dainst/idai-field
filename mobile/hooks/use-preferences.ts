import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { compose, detach, prepend, set, subtract, update } from 'tsfun';
import { Preferences, ProjectSettings } from '@/models/preferences';
import { defaultPointRadius } from '@/components/Project/Map/GLMap/constants';
import { MapSettings } from '@/components/Project/Map/map-settings';
import { getDefaultProjectLanguages } from '@/constants/korean-fieldwork-project';

export interface UsePreferences {
  preferences: Preferences;
  setCurrentProject: (project: string, languages?: string[]) => void;
  setUsername: (project: string) => void;
  setProjectSettings: (
    project: string,
    projectSettings: ProjectSettings
  ) => void;
  setLanguages: (languages: string[]) => void;
  removeProject: (project: string) => void;
  getMapSettings: (project: string) => MapSettings;
  setMapSettings: (project: string, mapSettings: MapSettings) => void;
}

const usePreferences = (): UsePreferences => {
  const [preferences, setPreferences] = useState<Preferences>(
    getDefaultPreferences()
  );

  useEffect(() => {
    loadPreferences().then(setPreferences);
  }, []);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const setCurrentProject = (project: string, _languages?: string[]) =>
    setPreferences((preferences) => {
      const previousProjectSettings = preferences.projects[project];
      const projectSettings = normalizeProjectSettings(
        project,
        previousProjectSettings ?? {},
        previousProjectSettings
      );

      return {
        ...preferences,
        currentProject: project,
        recentProjects: set(prepend(project)(preferences.recentProjects)),
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

  const setLanguages = (_languages: string[]) =>
    setPreferences((preferences) => {
      const languages = preferences.currentProject
        ? getDefaultProjectLanguages(preferences.currentProject)
        : getDefaultProjectLanguages('');

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

  const removeProject = (project: string) =>
    setPreferences(
      compose(
        update('projects', detach(project)),
        update('recentProjects', subtract([project])),
        update('currentProject', (p: string) => (p === project ? '' : p))
      )
    );

  const getMapSettings = (project: string): MapSettings =>
    preferences.projects[project].mapSettings;

  const setMapSettings = (project: string, mapSettings: MapSettings) => {
    const prefCopy = { ...preferences };
    prefCopy.projects[project].mapSettings = { ...mapSettings };
    setPreferences(prefCopy);
  };

  return {
    preferences,
    setCurrentProject,
    setUsername,
    setProjectSettings,
    setLanguages,
    removeProject,
    getMapSettings,
    setMapSettings,
  };
};

export default usePreferences;

const loadPreferences = async (): Promise<Preferences> => {
  const prefString = await AsyncStorage.getItem('preferences');
  return normalizePreferences(prefString ? JSON.parse(prefString) : getDefaultPreferences());
};

const savePreferences = async (preferences: Preferences) =>
  await AsyncStorage.setItem('preferences', JSON.stringify(preferences));

export const getDefaultPreferences = (): Preferences => ({
  languages: getDefaultProjectLanguages(''),
  currentProject: '',
  username: '',
  recentProjects: [],
  projects: {},
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

const normalizePreferences = (preferences: Preferences): Preferences => {
  const projects = Object.entries(preferences.projects ?? {}).reduce(
    (result, [project, projectSettings]) => ({
      ...result,
      [project]: normalizeProjectSettings(project, projectSettings),
    }),
    {} as Record<string, ProjectSettings>
  );
  const currentProjectSettings = preferences.currentProject
    ? projects[preferences.currentProject]
    : undefined;

  return {
    ...getDefaultPreferences(),
    ...preferences,
    projects,
    languages: currentProjectSettings?.languages
      ?? preferences.languages
      ?? getDefaultProjectLanguages(preferences.currentProject),
  };
};

const normalizeProjectSettings = (
  project: string,
  projectSettings: Partial<ProjectSettings>,
  previousProjectSettings?: ProjectSettings
): ProjectSettings => {
  return {
    ...getDefaultProjectSettings(project),
    ...previousProjectSettings,
    ...projectSettings,
    languages: getDefaultProjectLanguages(project),
  };
};
