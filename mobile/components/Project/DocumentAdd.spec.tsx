import {
  cleanup,
  fireEvent,
  render,
  RenderAPI,
  waitFor,
} from '@testing-library/react-native';
import {
  CategoryForm,
  createCategory,
  Forest,
  IdGenerator,
  Labels,
  NewDocument,
  PouchdbDatastore,
  ProjectConfiguration,
} from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import React from 'react';
import { t2 } from '@/test_data/test_docs/t2';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import { ProjectContext } from '@/contexts/project-context';
import { Preferences } from '@/models/preferences';
import { DocumentRepository } from '@/repositories/document-repository';
import loadConfiguration from '@/services/config/load-configuration';
import { ToastProvider } from '@/components/common/Toast/ToastProvider';
import DocumentAdd from '@/app/(tabs)/ProjectScreen/DocumentAdd';
import { defaultMapSettings } from '@/components/Project/Map/map-settings';

const category = 'Pottery';
const project = 'testdb';
const preferences: Preferences = {
  username: 'testUser',
  currentProject: project,
  languages: ['en'],
  recentProjects: [project],
  projects: {
    [project]: {
      url: '',
      password: '',
      connected: true,
      mapSettings: defaultMapSettings(),
    },
  },
};

const mockNavigate = jest.fn();
const mockUseGlobalSearchParams = jest.fn();
const setCurrentProject = jest.fn();
const setUsername = jest.fn();
const setProjectSettings = jest.fn();
const setLanguages = jest.fn();
const removeProject = jest.fn();
const setMapSettings = jest.fn();
const getMapSettings = jest.fn();

jest.mock('@/repositories/document-repository');
jest.mock('@/contexts/project-context', () => {
  const React = require('react');
  return { ProjectContext: React.createContext(null) };
});
jest.mock('dateformat', () => jest.fn(() => '2026-01-01'));
jest.mock('expo-barcode-scanner');
jest.mock('expo-router', () => ({
  router: { navigate: (...args: any[]) => mockNavigate(...args) },
  useGlobalSearchParams: () => mockUseGlobalSearchParams(),
}));

describe('DocumentAdd', () => {
  let repository: DocumentRepository;
  let config: ProjectConfiguration;
  let pouchdbDatastore: PouchdbDatastore;
  let renderAPI: RenderAPI;
  const shortDescription = 'This is a test document';

  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    mockUseGlobalSearchParams.mockReturnValue({
      parentDocId: t2.resource.id,
      categoryName: category,
    });

    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    await pouchdbDatastore.createDb(
      project,
      { _id: 'project', resource: { id: 'project' } },
      undefined,
      true
    );
    const categories: Forest<CategoryForm> = [
      createCategory('Feature'),
      createCategory(category),
    ];
    repository = await DocumentRepository.init(
      'testuser',
      createProjectConfiguration(categories),
      pouchdbDatastore
    );

    config = await loadConfiguration(
      pouchdbDatastore,
      project,
      preferences.languages,
      preferences.username
    );
    renderAPI = render(
      <ToastProvider>
        <PreferencesContext.Provider
          value={{
            preferences,
            setCurrentProject,
            setUsername,
            setProjectSettings,
            setLanguages,
            removeProject,
            setMapSettings,
            getMapSettings,
          }}
        >
          <LabelsContext.Provider value={{ labels: new Labels(() => ['en']) }}>
            <ConfigurationContext.Provider value={config}>
              <ProjectContext.Provider value={{ repository } as any}>
                <DocumentAdd />
              </ProjectContext.Provider>
            </ConfigurationContext.Provider>
          </LabelsContext.Provider>
        </PreferencesContext.Provider>
      </ToastProvider>
    );
  });

  afterEach(async () => {
    if (pouchdbDatastore) await pouchdbDatastore.destroyDb(project);
    cleanup();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockNavigate.mockClear();
    mockUseGlobalSearchParams.mockReset();
  });

  it('should render component correctly', async () => {
    await waitFor(() => renderAPI.getByTestId('documentForm'));

    expect(renderAPI.queryByTestId('documentForm')).toBeTruthy();
  });

  it('should create a new Document with entered values and correctly set relations field', async () => {
    const { getByTestId } = renderAPI;

    await waitFor(() => getByTestId('documentForm'));

    fireEvent.press(getByTestId('groupSelect_stem'));
    fireEvent.changeText(getByTestId('inputField_shortDescription'), shortDescription);
    fireEvent.press(getByTestId('saveDocBtn'));

    await waitFor(() => expect(repository.create).toHaveBeenCalledTimes(1));
    expect(repository.create).toHaveBeenCalledWith({
      resource: expect.objectContaining({
        identifier: 'pottery-1700000000000',
        shortDescription,
        category,
      }),
    } as NewDocument);
  });

  it('should navigate back to DocumentsMap after object hast been created', async () => {
    const { getByTestId } = renderAPI;
    const highlightedDocId = 'id'; //see mock of DocumentRepository class

    await waitFor(() => getByTestId('documentForm'));

    fireEvent.press(getByTestId('groupSelect_stem'));
    fireEvent.changeText(getByTestId('inputField_shortDescription'), shortDescription);
    fireEvent.press(getByTestId('saveDocBtn'));

    await waitFor(() => expect(repository.create).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/ProjectScreen/DocumentsMap',
      params: { highlightedDocId },
    });
  });
});

const createProjectConfiguration = (
  forms: Forest<CategoryForm>
): ProjectConfiguration =>
  new ProjectConfiguration({
    forms,
    categories: {},
    relations: [],
    commonFields: {},
    valuelists: {},
    projectLanguages: [],
  });
