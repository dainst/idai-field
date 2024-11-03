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
  PouchdbDatastore,
  ProjectConfiguration,
} from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import React from 'react';
import { t2 } from '@/test_data/test_docs/t2';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import { Preferences } from '@/models/preferences';
import { DocumentRepository } from '@/repositories/document-repository';
import loadConfiguration from '@/services/config/load-configuration';
import { ToastProvider } from '@/components/common/Toast/ToastProvider';
import DocumentEdit from './DocumentEdit';
import { defaultMapSettings } from './Map/map-settings';

const project = 'testdb';
const category = 'Pottery';
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

const navigate = jest.fn();
const setCurrentProject = jest.fn();
const setUsername = jest.fn();
const setProjectSettings = jest.fn();
const removeProject = jest.fn();
const getMapSettings = jest.fn();
const setMapSettings = jest.fn();

jest.mock('@/repositories/document-repository');
jest.mock('idai-field-core');
jest.mock('expo-barcode-scanner');

describe('DocumentEdit', () => {
  let repository: DocumentRepository;
  let config: ProjectConfiguration;
  let pouchdbDatastore: PouchdbDatastore;
  let renderAPI: RenderAPI;

  beforeEach(async () => {
    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    await pouchdbDatastore.createDb(
      project,
      { _id: 'project', resource: { id: 'project' } },
      true
    );
    const categories: Forest<CategoryForm> = [
      createCategory('Feature'),
      createCategory(category),
    ];
    repository = await DocumentRepository.init(
      'testuser',
      categories,
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
            removeProject,
            getMapSettings,
            setMapSettings,
          }}
        >
          <LabelsContext.Provider value={{ labels: new Labels(() => ['en']) }}>
            <ConfigurationContext.Provider value={config}>
              <DocumentEdit
                repository={repository}
                docId={t2.resource.id}
                categoryName={category}
                navigation={{ navigate }}
              />
            </ConfigurationContext.Provider>
          </LabelsContext.Provider>
        </PreferencesContext.Provider>
      </ToastProvider>
    );
  });

  afterEach(async (done) => {
    await pouchdbDatastore.destroyDb(project);
    cleanup();
    done();
    jest.clearAllMocks();
  });

  it('should render component correctly', async () => {
    await waitFor(() => renderAPI.getByTestId('barCodeScanner'));

    expect(renderAPI.queryByTestId('documentForm')).toBeTruthy();
  });

  it('should set input fields with correct values', async () => {
    const { getByTestId } = renderAPI;

    await waitFor(() => {
      getByTestId('barCodeScanner');
      fireEvent.press(getByTestId('groupSelect_stem'));
    });

    expect(getByTestId('inputField_identifier').props.value).toEqual(
      t2.resource.id.toUpperCase()
    );
    expect(getByTestId('inputField_shortDescription').props.value).toEqual(
      t2.resource.shortDescription
    );
  });

  it('should update document with changed values', async () => {
    const { getByTestId } = renderAPI;
    const newDescription = 'Changed description';
    const expectedDoc = { ...t2 };
    t2.resource.shortDescription = newDescription;

    await waitFor(() => {
      getByTestId('barCodeScanner');
      fireEvent.press(getByTestId('groupSelect_stem'));
      fireEvent.changeText(
        getByTestId('inputField_shortDescription'),
        newDescription
      );
      fireEvent.press(getByTestId('editDocBtn'));
    });

    expect(repository.update).toHaveBeenCalledWith(expectedDoc);
  });

  it('should navigate back to DocumentsMap after object hast been edited', async () => {
    const { getByTestId } = renderAPI;

    await waitFor(() => {
      getByTestId('barCodeScanner');
      fireEvent.press(getByTestId('groupSelect_stem'));
      fireEvent.changeText(
        getByTestId('inputField_shortDescription'),
        'newDescription'
      );
      fireEvent.press(getByTestId('editDocBtn'));
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('DocumentsMap', {
      highlightedDocId: t2.resource.id,
    });
  });
});
