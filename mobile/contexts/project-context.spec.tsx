import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SyncStatus } from 'idai-field-core';
import { ProjectContextProvider } from './project-context';
import { PreferencesContext } from './preferences-context';
import useFieldworkImageSync from '@/hooks/use-fieldwork-image-sync';
import useProjectData from '@/hooks/use-project-data';
import useSearch from '@/hooks/use-search';

const mockRepository = {};

jest.mock('@/hooks/use-pouchdb-datastore', () => jest.fn(() => ({})));
jest.mock('@/hooks/use-repository', () => jest.fn(() => mockRepository));
jest.mock('@/hooks/use-sync', () => {
  const { SyncStatus } = require('idai-field-core');
  return jest.fn(() => SyncStatus.InSync);
});
jest.mock('@/hooks/use-relations-manager', () => jest.fn(() => undefined));
jest.mock('@/hooks/use-project-data', () => jest.fn());
jest.mock('@/hooks/use-fieldwork-image-sync', () => jest.fn());
jest.mock('@/hooks/use-search', () => jest.fn());
jest.mock('@/hooks/use-orientation', () => jest.fn(() => 'portrait'));
jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
    setParams: jest.fn(),
  },
}));

describe('ProjectContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useProjectData as jest.Mock).mockReturnValue({
      documents: [createDocument('visible-feature', 'Feature')],
      hierarchyPath: [],
      pushToHierarchy: jest.fn(),
      popFromHierarchy: jest.fn(),
      clearHierarchy: jest.fn(),
      isInOverview: jest.fn(),
    });
    (useSearch as jest.Mock).mockReturnValue([
      createDocument('visible-feature', 'Feature'),
      createDocument('hidden-photo', 'Photo', {
        fieldworkPhotoUri: 'file:///tablet/photos/hidden-photo.jpg',
      }),
    ]);
  });

  it('syncs fieldwork images from all project documents instead of only the visible list', () => {
    const preferences = createPreferences();

    render(
      <PreferencesContext.Provider value={createPreferencesContext(preferences)}>
        <ProjectContextProvider>
          <Text>child</Text>
        </ProjectContextProvider>
      </PreferencesContext.Provider>
    );

    expect(useSearch).toHaveBeenCalledWith(
      mockRepository,
      {},
      { includeResourcesWithoutValidParent: true }
    );
    expect(useFieldworkImageSync).toHaveBeenCalledWith(
      expect.objectContaining({
        documents: expect.arrayContaining([
          expect.objectContaining({
            resource: expect.objectContaining({ id: 'hidden-photo' }),
          }),
        ]),
        project: 'fieldwork',
        projectSettings: preferences.projects.fieldwork,
        repository: mockRepository,
        syncStatus: SyncStatus.InSync,
      })
    );
  });
});

const createDocument = (
  id: string,
  category: string,
  resource: Record<string, unknown> = {}
) => ({
  resource: {
    id,
    category,
    identifier: id,
    relations: {},
    ...resource,
  },
});

const createPreferences = () => ({
  username: 'fieldworker',
  currentProject: 'fieldwork',
  languages: ['en'],
  recentProjects: ['fieldwork'],
  mapProviderSettings: {
    kakaoLocalRestApiKey: '',
    kakaoMapJavaScriptKey: '',
    kakaoNativeAppKey: '',
  },
  projects: {
    fieldwork: {
      connected: true,
      password: 'field-secret',
      url: 'https://field.example/db',
      mapSettings: { pointRadius: 6 },
    },
  },
});

const createPreferencesContext = (
  preferences: ReturnType<typeof createPreferences>
) => ({
  preferences,
  setCurrentProject: jest.fn(),
  setUsername: jest.fn(),
  setProjectSettings: jest.fn(),
  setLanguages: jest.fn(),
  removeProject: jest.fn(),
  setMapProviderSettings: jest.fn(),
  getMapSettings: jest.fn(() => ({ pointRadius: 6 })),
  setMapSettings: jest.fn(),
});
